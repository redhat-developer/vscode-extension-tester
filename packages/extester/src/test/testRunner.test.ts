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
import * as http from 'node:http';
import { AddressInfo } from 'node:net';
import * as os from 'os';
import * as path from 'path';
import { Session, WebDriver } from 'selenium-webdriver';
import { Executor, HttpClient } from 'selenium-webdriver/http';
import { VSBrowser } from '../browser';
import { parseTestRunner, selectTestRunner } from '../suite/adapter';
import { countFailures, EXTERNAL_PACKAGES, extesterPlugin, GREP_ENV, VitestAdapter, vitestCliOptions } from '../suite/vitest/vitestAdapter';
import { screenshotName } from '../suite/vitest/worker';
import { ReleaseQuality } from '../util/codeUtil';

describe('parseTestRunner', () => {
	it('defaults to mocha', () => {
		assert.strictEqual(parseTestRunner(undefined), 'mocha');
		assert.strictEqual(parseTestRunner(''), 'mocha');
	});

	it('accepts the runner names in any case', () => {
		assert.strictEqual(parseTestRunner('Vitest'), 'vitest');
		assert.strictEqual(parseTestRunner(' mocha '), 'mocha');
	});

	it('rejects unknown runners', () => {
		assert.throws(() => parseTestRunner('jest'), /Unknown test runner "jest". Use one of: mocha, vitest/);
	});
});

describe('selectTestRunner', () => {
	it('uses the Mocha configuration with Mocha', () => {
		assert.deepStrictEqual(selectTestRunner({ config: '.mocharc.yml', vitestConfig: 'vitest.config.ts' }), { name: 'mocha', configFile: '.mocharc.yml' });
	});

	it('uses the Vitest configuration with Vitest', () => {
		assert.deepStrictEqual(selectTestRunner({ testRunner: 'vitest', config: '.mocharc.yml', vitestConfig: 'vitest.config.ts' }), {
			name: 'vitest',
			configFile: 'vitest.config.ts',
		});
	});

	it('rejects the hidden window mode with Vitest', () => {
		assert.throws(() => selectTestRunner({ testRunner: 'vitest', hiddenWindow: true }), /hidden window mode is not supported with the Vitest/);
		assert.throws(() => selectTestRunner({ testRunner: 'vitest' }, true), /hidden window mode is not supported with the Vitest/);
	});

	it('keeps the hidden window mode with Mocha', () => {
		assert.strictEqual(selectTestRunner({ hiddenWindow: true }, true).name, 'mocha');
	});
});

describe('Vitest adapter options', () => {
	const savedGrep = { extester: process.env[GREP_ENV], mocha: process.env.MOCHA_GREP };

	afterEach(() => {
		for (const [key, value] of [
			[GREP_ENV, savedGrep.extester],
			['MOCHA_GREP', savedGrep.mocha],
		] as const) {
			if (value === undefined) {
				delete process.env[key];
			} else {
				process.env[key] = value;
			}
		}
	});

	it('runs once, with an absolute config path', () => {
		delete process.env[GREP_ENV];
		delete process.env.MOCHA_GREP;
		const options = vitestCliOptions('vitest.config.ts');
		assert.strictEqual(options.run, true);
		assert.strictEqual(options.watch, false);
		assert.strictEqual(options.config, path.resolve('vitest.config.ts'));
		assert.strictEqual(options.testNamePattern, undefined);
	});

	it('maps EXTESTER_GREP, then MOCHA_GREP, to the test name pattern', () => {
		process.env.MOCHA_GREP = 'from mocha';
		assert.strictEqual(vitestCliOptions(undefined).testNamePattern, 'from mocha');
		process.env[GREP_ENV] = 'from extester';
		assert.strictEqual(vitestCliOptions(undefined).testNamePattern, 'from extester');
	});

	it("keeps the user's timeouts and forces one file at a time", () => {
		const plugin = extesterPlugin();
		const config = (plugin.config as (config: object) => { test: Record<string, unknown> })({ test: { testTimeout: 5 } });
		assert.strictEqual(config.test.testTimeout, 5);
		assert.strictEqual(config.test.hookTimeout, 120_000);
		assert.strictEqual(config.test.fileParallelism, false);
		assert.strictEqual(config.test.maxWorkers, 1);
		assert.ok(fs.existsSync((config.test.setupFiles as string[])[0]));
	});

	it('externalizes installed and linked ExTester packages', () => {
		const matches = (file: string) => EXTERNAL_PACKAGES.some((pattern) => pattern.test(file));
		assert.ok(matches('/p/node_modules/vscode-extension-tester/out/extester.js'));
		assert.ok(matches('C:\\p\\node_modules\\@redhat-developer\\page-objects\\out\\index.js'));
		assert.ok(matches('/repo/packages/locators/out/lib/1.100.0.js'));
		assert.ok(!matches('/p/ui-test/my.test.ts'));
	});

	it('names screenshots like Mocha does', () => {
		assert.strictEqual(screenshotName('Suite > nested > fails: a/b'), 'Suite nested fails ab');
	});

	it('counts failed tests, failed files without failed tests and unhandled errors', () => {
		const module = (state: string, failedTests: number) => ({
			state: () => state,
			children: { allTests: () => Array.from({ length: failedTests }) },
		});
		const result = { testModules: [module('failed', 2), module('failed', 0), module('passed', 0)], unhandledErrors: [new Error()] };
		assert.strictEqual(countFailures(result as never), 4);
	});
});

describe('VSBrowser.attach', () => {
	it('refuses to quit a VS Code window it does not own', async () => {
		const browser = VSBrowser.attach({
			serverUrl: 'http://127.0.0.1:1',
			sessionId: 'session',
			capabilities: {},
			codeVersion: '1.100.0',
			releaseType: ReleaseQuality.Stable,
			customSettings: {},
			logLevel: 'INFO',
			locale: '',
			startTimestamp: '20261127T000000',
		});
		assert.ok(browser.isAttached);
		assert.strictEqual(VSBrowser.instance, browser);
		assert.ok(browser.getScreenshotsDir().endsWith(path.join('screenshots', '20261127T000000')));
		await assert.rejects(() => browser.quit(), /owned by the ExTester process/);
		await assert.rejects(() => browser.getSessionInfo(), /not started by this process/);
	});
});

describe('VitestAdapter run against a fake WebDriver server', function () {
	this.timeout(60_000);
	const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
	const savedResources = process.env.TEST_RESOURCES;
	let server: http.Server;
	let storage: string;

	before(async () => {
		storage = fs.mkdtempSync(path.join(os.tmpdir(), 'extester-vitest-'));
		process.env.TEST_RESOURCES = storage;
		server = http.createServer((req, res) => {
			res.setHeader('content-type', 'application/json');
			if (req.url?.endsWith('/title')) {
				res.end(JSON.stringify({ value: 'Fake VS Code' }));
			} else if (req.url?.endsWith('/screenshot')) {
				res.end(JSON.stringify({ value: PNG }));
			} else {
				res.statusCode = 404;
				res.end(JSON.stringify({ value: { error: 'unknown command', message: String(req.url) } }));
			}
		});
		await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
	});

	after(() => {
		server.close();
		fs.rmSync(storage, { recursive: true, force: true });
		if (savedResources === undefined) {
			delete process.env.TEST_RESOURCES;
		} else {
			process.env.TEST_RESOURCES = savedResources;
		}
	});

	it('starts the workbench, runs every file attached to it, screenshots failures and stops the workbench', async () => {
		const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
		const browser = new VSBrowser('1.100.0', ReleaseQuality.Stable);
		const events: string[] = [];
		const workbench = {
			setup: async () => {
				events.push('setup');
				// what browser.start() leaves behind, without launching VS Code
				Object.assign(browser, {
					_driver: new WebDriver(new Session('fake-session', {}), new Executor(Promise.resolve(new HttpClient(url)))),
					serverUrl: url,
				});
			},
			teardown: async () => {
				events.push('teardown');
			},
		};
		const fixtures = path.resolve(__dirname, '..', '..', 'test-fixtures', 'vitest');
		const testFiles = [path.join(fixtures, 'attached.test.mjs'), path.join(fixtures, 'second.test.mjs')];

		const code = await new VitestAdapter().run({ testFiles, browser, workbench });

		assert.strictEqual(code, 1);
		assert.deepStrictEqual(events, ['setup', 'teardown']);
		assert.deepStrictEqual(fs.readdirSync(browser.getScreenshotsDir()), ['Attached suite fails on purpose.png']);
	});

	it('still stops the workbench and fails the run when it cannot start', async () => {
		const events: string[] = [];
		const workbench = {
			setup: async () => {
				events.push('setup');
				throw new Error('VS Code did not start');
			},
			teardown: async () => {
				events.push('teardown');
			},
		};
		const code = await new VitestAdapter().run({ testFiles: [], browser: new VSBrowser('1.100.0', ReleaseQuality.Stable), workbench });
		assert.strictEqual(code, 1);
		assert.deepStrictEqual(events, ['setup', 'teardown']);
	});
});
