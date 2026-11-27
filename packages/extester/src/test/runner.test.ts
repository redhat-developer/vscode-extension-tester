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
import * as fs from 'fs';
import * as os from 'os';
import Mocha from 'mocha';
import * as path from 'path';
import { VSBrowser } from '../browser';
import { exitCode, screenshotsReport } from '../suite/runner';
import { GlobalFixture, installGlobalFixtures, loadMochaConfig as loadMochaConfigFile } from '../suite/mocha/mochaAdapter';
import { ReleaseQuality } from '../util/codeUtil';

/**
 * Writes a mocha YAML config with the given content into a fresh temp dir and returns its path.
 */
function writeMocharc(content: string, name = '.mocharc.yml'): string {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'extester-runner-test-'));
	const file = path.join(dir, name);
	fs.writeFileSync(file, content, 'utf8');
	return file;
}

/**
 * Loads a mocha config file through the Mocha adapter's loader so the assertions target exactly
 * what `new Mocha(...)` receives.
 */
function loadMochaConfig(file: string): Mocha.MochaOptions {
	return loadMochaConfigFile(file);
}

describe('Mocha adapter config loading (YAML)', () => {
	const tmpDirs: string[] = [];

	afterEach(() => {
		for (const dir of tmpDirs.splice(0)) {
			fs.rmSync(dir, { recursive: true, force: true });
		}
	});

	function mocharc(content: string, name?: string): string {
		const file = writeMocharc(content, name);
		tmpDirs.push(path.dirname(file));
		return file;
	}

	it('parses common mocha options from .mocharc.yml', () => {
		const file = mocharc(['timeout: 5000', 'require: ts-node/register', 'spec:', '  - out/**/*.js', 'bail: true', 'slow: 75', 'retries: 2', ''].join('\n'));
		const conf = loadMochaConfig(file);
		assert.deepStrictEqual(conf, {
			timeout: 5000,
			require: 'ts-node/register',
			spec: ['out/**/*.js'],
			bail: true,
			slow: 75,
			retries: 2,
		});
	});

	it('accepts the .yaml extension too', () => {
		const file = mocharc('timeout: 1234\n', '.mocharc.yaml');
		assert.deepStrictEqual(loadMochaConfig(file), { timeout: 1234 });
	});

	it('keeps YAML 1.2 scalar semantics (yes/on stay strings, like mocha itself)', () => {
		const file = mocharc('bail: yes\ncolor: on\nparallel: true\n');
		assert.deepStrictEqual(loadMochaConfig(file), { bail: 'yes', color: 'on', parallel: true });
	});

	it('honours YAML merge keys (<<) the same way mocha does', () => {
		const file = mocharc(['defaults: &defaults', '  timeout: 3000', '  retries: 1', '<<: *defaults', 'bail: true', ''].join('\n'));
		const conf = loadMochaConfig(file);
		assert.deepStrictEqual(conf, { defaults: { timeout: 3000, retries: 1 }, timeout: 3000, retries: 1, bail: true });
		assert.ok(!('<<' in conf), 'merge key must be applied, not kept as a literal "<<" key');
	});

	it('treats an empty config file as "no options" instead of failing', () => {
		const file = mocharc('');
		assert.deepStrictEqual(loadMochaConfig(file), {});
	});

	it('treats a comment-only config file as "no options" instead of failing', () => {
		const file = mocharc('# mocha options go here\n');
		assert.deepStrictEqual(loadMochaConfig(file), {});
	});

	it('rejects a multi-document YAML config when the config was passed explicitly', () => {
		const file = mocharc('timeout: 1000\n---\ntimeout: 2000\n');
		assert.throws(() => loadMochaConfig(file), /Failed to parse mocha configuration/);
	});

	it('still rejects malformed YAML when the config was passed explicitly', () => {
		const file = mocharc('timeout: [unclosed\n');
		assert.throws(() => loadMochaConfig(file), /Failed to parse mocha configuration/);
	});
});

describe('screenshotsReport', () => {
	let dir: string;

	beforeEach(() => {
		dir = fs.mkdtempSync(path.join(os.tmpdir(), 'extester-screenshots-test-'));
	});

	afterEach(() => {
		fs.rmSync(dir, { recursive: true, force: true });
	});

	it('points to the screenshots folder when screenshots were captured', () => {
		fs.writeFileSync(path.join(dir, 'failed test.png'), '');
		assert.strictEqual(screenshotsReport(dir), `INFO: Screenshots of failures can be found in: ${dir}`);
	});

	it('does not advertise a folder that was never created (#2073)', () => {
		const missing = path.join(dir, 'screenshots', '20250918T180621');
		const report = screenshotsReport(missing);
		assert.ok(!report.includes(missing), report);
		assert.match(report, /No screenshots of failures were captured/);
	});

	it('does not advertise an empty screenshots folder', () => {
		assert.match(screenshotsReport(dir), /No screenshots of failures were captured/);
	});
});

describe('VSBrowser.quit without a session', () => {
	it('is a no-op when the browser never started (#2073)', async () => {
		const errors: unknown[][] = [];
		const originalError = console.error;
		console.error = (...args: unknown[]) => errors.push(args);
		try {
			await new VSBrowser('1.100.0', ReleaseQuality.Stable).quit();
		} finally {
			console.error = originalError;
		}
		assert.deepStrictEqual(errors, []);
	});
});

describe('installGlobalFixtures', () => {
	let calls: string[];
	let errors: unknown[][];
	let originalError: typeof console.error;

	beforeEach(() => {
		calls = [];
		errors = [];
		originalError = console.error;
		console.error = (...args: unknown[]) => errors.push(args);
	});

	afterEach(() => {
		console.error = originalError;
	});

	/** Track the call order, optionally failing with the given message */
	function step(name: string, failWith?: string): () => Promise<void> {
		return async () => {
			calls.push(name);
			if (failWith) {
				throw new Error(failWith);
			}
		};
	}

	/** Run a nested Mocha instance with fake workbench callbacks and a single passing test, unless `withTest` is false */
	async function run(options: Mocha.MochaOptions, workbench = { setup: step('workbench setup'), teardown: step('workbench teardown') }, withTest = true) {
		// the base reporter prints nothing, keeping the nested run out of the outer reporter's output
		const mocha = new Mocha({ ...options, reporter: Mocha.reporters.Base });
		if (withTest) {
			mocha.suite.addTest(
				new Mocha.Test('test', () => {
					calls.push('test');
				}),
			);
		}
		const state = installGlobalFixtures(mocha, workbench);
		const failures = await new Promise<number>((resolve) => mocha.run(resolve));
		return { failures, state, code: exitCode(failures, state) };
	}

	it('starts the workbench before the user fixtures and shuts it down after them, sharing the context', async () => {
		const globalSetup: GlobalFixture = async function (this: { shared?: string }) {
			calls.push('user setup');
			this.shared = 'value';
		};
		const globalTeardown: GlobalFixture = async function (this: { shared?: string }) {
			calls.push(`user teardown ${this.shared}`);
		};
		const { code } = await run({ globalSetup, globalTeardown });
		assert.deepStrictEqual(calls, ['workbench setup', 'user setup', 'test', 'user teardown value', 'workbench teardown']);
		assert.strictEqual(code, 0);
	});

	it('still shuts down the workbench and fails the run when the workbench does not start', async () => {
		const { failures, state, code } = await run(
			{ globalTeardown: step('user teardown') },
			{ setup: step('workbench setup', 'VS Code did not start'), teardown: step('workbench teardown') },
		);
		assert.deepStrictEqual(calls, ['workbench setup', 'user teardown', 'workbench teardown']);
		assert.strictEqual(failures, 1);
		assert.match(String(state.setupError), /VS Code did not start/);
		assert.strictEqual(code, 1);
	});

	it('still shuts down the workbench and fails the run when a user setup fixture throws', async () => {
		const { failures, code } = await run({ globalSetup: [step('user setup', 'setup failed'), step('second user setup')] });
		assert.deepStrictEqual(calls, ['workbench setup', 'user setup', 'workbench teardown']);
		assert.strictEqual(failures, 1);
		assert.strictEqual(code, 1);
	});

	it('fails the run when the setup fails and there is no test to report it', async () => {
		const { failures, state, code } = await run({ globalSetup: step('user setup', 'setup failed') }, undefined, false);
		assert.deepStrictEqual(calls, ['workbench setup', 'user setup', 'workbench teardown']);
		assert.strictEqual(failures, 0);
		assert.ok(state.setupFailed);
		assert.strictEqual(code, 1);
	});

	it('runs the remaining teardown fixtures and fails the run when a user teardown fixture throws', async () => {
		const { failures, state, code } = await run({ globalTeardown: [step('user teardown', 'teardown failed'), step('second user teardown')] });
		assert.deepStrictEqual(calls, ['workbench setup', 'test', 'user teardown', 'second user teardown', 'workbench teardown']);
		assert.strictEqual(failures, 0);
		assert.ok(state.teardownFailed);
		assert.strictEqual(code, 1);
		assert.match(String(errors[0]?.[1]), /teardown failed/);
	});

	it('fails the run when the workbench does not shut down', async () => {
		const { code } = await run({}, { setup: step('workbench setup'), teardown: step('workbench teardown', 'quit failed') });
		assert.deepStrictEqual(calls, ['workbench setup', 'test', 'workbench teardown']);
		assert.strictEqual(code, 1);
	});

	it('skips disabled user fixtures but still manages the workbench', async () => {
		const { code } = await run({
			globalSetup: step('user setup'),
			globalTeardown: step('user teardown'),
			enableGlobalSetup: false,
			enableGlobalTeardown: false,
		});
		assert.deepStrictEqual(calls, ['workbench setup', 'test', 'workbench teardown']);
		assert.strictEqual(code, 0);
	});
});
