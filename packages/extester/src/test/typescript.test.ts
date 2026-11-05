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

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

// Each consumer runs in a fresh process so loader hooks and module caches cannot
// conceal a missing dependency or leak between test cases.
describe('VSRunner TypeScript consumers', function () {
	this.timeout(30_000);
	let project: string;

	beforeEach(() => {
		project = fs.mkdtempSync(path.join(os.tmpdir(), 'extester-ts-consumer-'));
		fs.writeFileSync(path.join(project, 'package.json'), '{}');
	});

	afterEach(() => fs.rmSync(project, { recursive: true, force: true }));

	function write(name: string, source: string) {
		fs.mkdirSync(path.dirname(path.join(project, name)), { recursive: true });
		fs.writeFileSync(path.join(project, name), source);
	}

	function installTsx() {
		fs.mkdirSync(path.join(project, 'node_modules'), { recursive: true });
		fs.symlinkSync(path.dirname(require.resolve('tsx/package.json')), path.join(project, 'node_modules/tsx'), 'junction');
	}

	function run(pattern = '*.test.*', locator?: string, cwd = project) {
		const script = `
			const { VSRunner } = require(${JSON.stringify(require.resolve('../suite/runner'))});
			const { VSBrowser } = require(${JSON.stringify(require.resolve('../browser'))});
			const { ReleaseQuality } = require(${JSON.stringify(require.resolve('../util/codeUtil'))});
			const { VSCODE_VERSION_MIN } = require(${JSON.stringify(require.resolve('../extester'))});
			// Only replace the external browser lifecycle; use real Mocha and module loading.
			VSBrowser.prototype.start = async function () {
				${locator ? `require('node:assert/strict').equal(require(require('node:path').resolve(${JSON.stringify(locator)})).locators.answer, 42);` : ''}
				return this;
			};
			VSBrowser.prototype.waitForWorkbench = async () => {};
			VSBrowser.prototype.quit = async () => {};
			const originalTsHook = require.extensions['.ts'];
			const options = ${JSON.stringify(locator ? { locatorsPath: locator } : undefined) ?? 'undefined'};
			const runner = new VSRunner(process.execPath, VSCODE_VERSION_MIN, ReleaseQuality.Stable, undefined, options);
			runner.runTests([${JSON.stringify(pattern)}], {
				coverageEnabled: false, uninstallExtension() {}, getCodeFolder() { return process.cwd(); }
			}, []).finally(() => {
				require('node:assert/strict').equal(require.extensions['.ts'], originalTsHook, 'TypeScript hook leaked after run');
			}).catch(error => { console.error(error); process.exitCode = 1; });
		`;
		// Older Node 22 releases have no built-in stripping and do not recognize this flag.
		const flags = process.allowedNodeEnvironmentFlags.has('--experimental-strip-types') ? ['--no-experimental-strip-types'] : [];
		const result = spawnSync(process.execPath, [...flags, '-e', script], {
			cwd,
			encoding: 'utf8',
			timeout: 20_000,
		});
		assert.ifError(result.error);
		return result;
	}

	it('executes mixed suites with TypeScript helpers and custom locators from a workspace', () => {
		installTsx();
		write('packages/tests/package.json', '{}');
		write('packages/tests/helper.ts', 'export const answer: number = 42;');
		write('packages/tests/locators.ts', "import { answer } from './helper'; export const locators = { answer };");
		write('packages/tests/example.test.ts', "import { answer } from './helper'; it('TS executed', () => require('node:assert/strict').equal(answer, 42));");
		write('packages/tests/example.test.js', "it('JS executed', () => {});");
		const result = run('*.test.*', 'locators.ts', path.join(project, 'packages/tests'));
		assert.equal(result.status, 0, result.stdout + result.stderr);
		assert.match(result.stdout, /2 passing/);
	});

	for (const extension of ['tsx', 'cts']) {
		it(`executes .${extension} tests without emitting JavaScript`, () => {
			installTsx();
			write(`example.test.${extension}`, "const answer: number = 42; it('TS executed', () => require('node:assert/strict').equal(answer, 42));");
			const result = run();
			assert.equal(result.status, 0, result.stdout + result.stderr);
			assert.match(result.stdout, /1 passing/);
			assert.ok(!fs.existsSync(path.join(project, 'example.test.js')));
		});
	}

	it('preserves module errors and removes the loader after a failed load', () => {
		installTsx();
		write('example.test.ts', "const message: string = 'test module failed'; throw new Error(message);");
		const result = run();
		assert.equal(result.status, 1, result.stdout + result.stderr);
		assert.match(result.stderr, /test module failed/);
		assert.doesNotMatch(result.stderr, /TypeScript hook leaked|npm install --save-dev tsx/);
	});

	it('loads TypeScript custom locators with JavaScript-only tests', () => {
		installTsx();
		write('locators.ts', 'export const locators: { answer: number } = { answer: 42 };');
		write('example.test.js', "it('JS executed', () => {});");
		const result = run('*.test.js', 'locators.ts');
		assert.equal(result.status, 0, result.stdout + result.stderr);
		assert.match(result.stdout, /1 passing/);
	});

	for (const extension of ['ts', 'tsx', 'cts']) {
		it(`explains how to install tsx for .${extension} tests when it is missing`, () => {
			write(`example.test.${extension}`, "it('TS test', () => {});");
			const result = run();
			assert.equal(result.status, 1, result.stdout + result.stderr);
			assert.match(result.stderr, /tsx/);
			assert.match(result.stderr, /npm install --save-dev tsx/);
			assert.match(result.stderr, /yarn add --dev tsx/);
			assert.match(result.stderr, /pnpm add --save-dev tsx/);
			assert.ok(result.stderr.includes(project), result.stderr);
			assert.ok(result.stderr.includes(`example.test.${extension}`), result.stderr);
		});
	}

	it('requires tsx for TypeScript locators even when no test matches', () => {
		write('locators.ts', 'export const locators = {};');
		const result = run('*.test.js', 'locators.ts');
		assert.equal(result.status, 1, result.stdout + result.stderr);
		assert.match(result.stderr, /npm install --save-dev tsx/);
		assert.match(result.stderr, /locators.ts/);
	});

	it('runs JavaScript without tsx', () => {
		write('example.test.js', "it('JS executed', () => {});");
		const result = run();
		assert.equal(result.status, 0, result.stdout + result.stderr);
		assert.match(result.stdout, /1 passing/);
	});

	it('does not misreport a broken tsx installation as a missing dependency', () => {
		write('node_modules/tsx/package.json', JSON.stringify({ exports: { './cjs/api': './broken.cjs' } }));
		write('node_modules/tsx/broken.cjs', "throw new Error('loader initialization failed');");
		write('example.test.ts', "it('TS test', () => {});");
		const result = run();
		assert.equal(result.status, 1, result.stdout + result.stderr);
		assert.match(result.stderr, /loader initialization failed/);
		assert.doesNotMatch(result.stderr, /npm install --save-dev tsx/);
	});
});
