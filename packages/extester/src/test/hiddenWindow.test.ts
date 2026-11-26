/**
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License", destination); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import assert from 'assert';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs-extra';
import { Session, WebDriver } from 'selenium-webdriver';
import { Command } from 'selenium-webdriver/lib/command';
import {
	HIDDEN_WINDOW_ENV,
	adoptSession,
	closeBidiConnection,
	filesToReopen,
	forwardToCurrentSession,
	hiddenWindowArgs,
	isHiddenWindowRequested,
	supportsHiddenWindow,
	trackOpened,
} from '../util/hiddenWindow';

describe('hiddenWindow', function () {
	describe('isHiddenWindowRequested', function () {
		it('is off when the variable is missing', function () {
			assert.strictEqual(isHiddenWindowRequested({}), false);
		});

		for (const value of ['true', 'TRUE', '1', ' true ']) {
			it(`is on for ${JSON.stringify(value)}`, function () {
				assert.strictEqual(isHiddenWindowRequested({ [HIDDEN_WINDOW_ENV]: value }), true);
			});
		}

		for (const value of ['false', '0', '', 'yes']) {
			it(`is off for ${JSON.stringify(value)}`, function () {
				assert.strictEqual(isHiddenWindowRequested({ [HIDDEN_WINDOW_ENV]: value }), false);
			});
		}
	});

	describe('supportsHiddenWindow', function () {
		it('rejects releases before 1.147.0', function () {
			assert.strictEqual(supportsHiddenWindow('1.146.2'), false);
			assert.strictEqual(supportsHiddenWindow('1.99.0'), false);
		});

		it('accepts 1.147.0 and newer, including insiders', function () {
			assert.strictEqual(supportsHiddenWindow('1.147.0'), true);
			assert.strictEqual(supportsHiddenWindow('1.148.1'), true);
			assert.strictEqual(supportsHiddenWindow('1.149.0-insider'), true);
		});

		it('rejects a version it cannot parse', function () {
			assert.strictEqual(supportsHiddenWindow('custom'), false);
		});
	});

	describe('hiddenWindowArgs', function () {
		let storage: string;

		beforeEach(function () {
			storage = fs.mkdtempSync(path.join(os.tmpdir(), 'extester-hidden-'));
		});

		afterEach(function () {
			fs.removeSync(storage);
		});

		it('adds the flag, a keep-alive runner and a development path', function () {
			const args = hiddenWindowArgs(storage, false);
			const hostDir = path.join(storage, 'hidden-window-host');
			assert.deepStrictEqual(args, [
				'--hidden-window',
				`--extensionTestsPath=${path.join(hostDir, 'keepalive.js')}`,
				`--extensionDevelopmentPath=${hostDir}`,
			]);
			const manifest = fs.readJSONSync(path.join(hostDir, 'package.json'));
			assert.strictEqual(manifest.main, undefined, 'the host must not need activating');
			assert.ok(manifest.engines.vscode);
		});

		it('reuses an existing development path', function () {
			const args = hiddenWindowArgs(storage, true);
			assert.ok(!args.some((arg) => arg.startsWith('--extensionDevelopmentPath=')));
		});

		it('generates a runner that never settles', async function () {
			hiddenWindowArgs(storage, false);
			const runner = require(path.join(storage, 'hidden-window-host', 'keepalive.js'));
			const outcome = await Promise.race([runner.run().then(() => 'settled'), new Promise((resolve) => setTimeout(() => resolve('pending'), 50))]);
			assert.strictEqual(outcome, 'pending');
		});
	});

	describe('session restart', function () {
		class FakeCommand {
			params: Record<string, unknown> = { sessionId: 'old' };
			setParameter(name: string, value: unknown) {
				this.params[name] = value;
				return this;
			}
		}
		const executor = (name: string, sent: string[]) => ({
			execute: async (command: FakeCommand) => {
				sent.push(`${name}:${String(command.params.sessionId)}`);
				return name;
			},
		});
		const fakeDriver = (id: string, exec: ReturnType<typeof executor>) => ({
			session_: Promise.resolve({ getId: () => id }),
			executor_: exec,
			onQuit_: () => id,
			_cdpConnection: {},
			getSession() {
				return this.session_;
			},
			getExecutor() {
				return this.executor_;
			},
		});

		/** A real selenium WebDriver whose executor records the commands instead of sending them. */
		const realDriver = (id: string, sent: string[], quits: string[]) =>
			new WebDriver(
				Promise.resolve(new Session(id, {})),
				{
					execute: async (command: Command) => {
						sent.push(`${id}:${command.getName()}:${String(command.getParameter('sessionId'))}`);
						return { value: id };
					},
				},
				() => quits.push(id),
			);

		it('adoptSession moves the session, executor and quit hook of a real WebDriver', async function () {
			const sent: string[] = [];
			const quits: string[] = [];
			const target = realDriver('a', sent, quits);
			const source = realDriver('b', sent, quits);
			adoptSession(target, source);
			assert.strictEqual((await target.getSession()).getId(), 'b');
			assert.strictEqual(target.getExecutor(), source.getExecutor());
			await target.getTitle();
			assert.deepStrictEqual(sent, ['b:getTitle:b']);
			await target.quit();
			assert.deepStrictEqual(quits, ['b']);
		});

		it('adoptSession fails clearly when selenium no longer has a session field', function () {
			const target = fakeDriver('a', executor('a', []));
			const source: Record<string, unknown> = fakeDriver('b', executor('b', []));
			delete source.onQuit_;
			assert.throws(() => adoptSession(target, source), /no onQuit_ field/);
		});

		it('closeBidiConnection is a no-op for a driver without a BiDi connection', async function () {
			await assert.doesNotReject(closeBidiConnection(realDriver('a', [], [])));
		});

		it('forwards commands sent to the old executor to the current session', async function () {
			const sent: string[] = [];
			const old = executor('old', sent);
			const driver = fakeDriver('old', old);
			adoptSession(driver, fakeDriver('new', executor('new', sent)));
			forwardToCurrentSession(old, driver);
			assert.strictEqual(await old.execute(new FakeCommand()), 'new');
			assert.deepStrictEqual(sent, ['new:new']);
		});

		it('follows the session across several restarts', async function () {
			const sent: string[] = [];
			const first = executor('first', sent);
			const driver = fakeDriver('first', first);
			adoptSession(driver, fakeDriver('second', executor('second', sent)));
			forwardToCurrentSession(first, driver);
			const second = driver.getExecutor();
			adoptSession(driver, fakeDriver('third', executor('third', sent)));
			forwardToCurrentSession(second, driver);
			await first.execute(new FakeCommand());
			await second.execute(new FakeCommand());
			assert.deepStrictEqual(sent, ['third:third', 'third:third']);
		});
	});

	describe('reload tracking', function () {
		const isWorkspace = (resource: string) => resource.endsWith('folder') || resource.endsWith('.code-workspace');
		const empty = { workspace: [], files: [] };

		it('resolves relative folders and files', function () {
			const state = trackOpened(empty, ['folder', 'a.ts'], isWorkspace);
			assert.deepStrictEqual(state, { workspace: [path.resolve('folder')], files: [path.resolve('a.ts')] });
		});

		it('moves a file opened again to the end', function () {
			let state = trackOpened(empty, ['/w/folder', '/w/a.ts', '/w/b.ts'], isWorkspace);
			state = trackOpened(state, ['/w/a.ts'], isWorkspace);
			assert.deepStrictEqual(state.files, [path.resolve('/w/b.ts'), path.resolve('/w/a.ts')]);
		});

		it('forgets the files of a previous folder', function () {
			let state = trackOpened(empty, ['/w/folder', '/w/a.ts'], isWorkspace);
			state = trackOpened(state, ['/x/other.code-workspace'], isWorkspace);
			assert.deepStrictEqual(state, { workspace: [path.resolve('/x/other.code-workspace')], files: [] });
		});

		it('reopens only files whose editor is open, by exact title', function () {
			const files = ['/w/foo.ts', '/w/bar.ts', '/w/gone.ts'];
			const reopened = filesToReopen(files, ['foo.tsx', 'bar.ts'], 'bar.ts', () => true);
			assert.deepStrictEqual(reopened, ['/w/bar.ts']);
		});

		it('puts the active editor last and skips deleted files', function () {
			const files = ['/w/a.ts', '/w/b.ts', '/w/c.ts'];
			const reopened = filesToReopen(files, ['a.ts', 'b.ts', 'c.ts'], 'a.ts', (file) => file !== '/w/c.ts');
			assert.deepStrictEqual(reopened, ['/w/b.ts', '/w/a.ts']);
		});
	});
});
