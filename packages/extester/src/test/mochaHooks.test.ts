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
import { execFile } from 'child_process';
import * as fs from 'fs-extra';
import * as os from 'os';
import * as path from 'path';
import { promisify } from 'util';
import { after as extesterAfter, before as extesterBefore, beforeEach as extesterBeforeEach } from '../suite/mochaHooks';

/** The compiled module that exports ExTester's hooks and `VSBrowser`. */
const EXTESTER = path.resolve(__dirname, '..', 'extester');

/** The compiled module that makes every hook take a screenshot when it fails. */
const HOOK_SCREENSHOTS = path.resolve(__dirname, '..', 'suite', 'hookScreenshots');

/** What a Mocha run reported, and the screenshots that the hooks took. */
interface MochaResult {
	passed: string[];
	failed: string[];
	pending: string[];
	screenshots: string[];
	/** The error thrown while Mocha loaded the test file. */
	loadError?: string;
}

/** How the stand-in for the browser takes screenshots. */
interface ScreenshotOptions {
	/** How long a screenshot takes, in milliseconds, or `never` for one that does not end. Default 0. */
	delay?: number | 'never';
	/** The time limit of a screenshot, in milliseconds. Default: ExTester's. */
	limit?: number;
}

/**
 * Runs Mocha on one test file as `extest` does: every hook of the test file takes a screenshot when it
 * fails. `VSBrowser` is replaced by a stand-in that records the names of the screenshots it is asked to
 * take. Writes a {@link MochaResult} to a file.
 * Arguments: path of Mocha, path of ExTester, path of the hook screenshots module, `ui`, test file,
 * result file, screenshot delay (`never` or milliseconds), screenshot limit (milliseconds or empty).
 */
const RUNNER = `
const fs = require('fs');
const [mochaPath, extester, hookScreenshots, ui, testFile, resultFile, delay, limit] = process.argv.slice(2);
const Mocha = require(mochaPath);
const { VSBrowser } = require(extester);
const result = { passed: [], failed: [], pending: [], screenshots: [] };
VSBrowser._instance = {
	takeScreenshot: (name) => {
		result.screenshots.push(name);
		return delay === 'never' ? new Promise(() => {}) : new Promise((resolve) => setTimeout(resolve, Number(delay)));
	},
};
const screenshots = require(hookScreenshots);
if (limit) {
	screenshots.screenshotLimits.timeout = Number(limit);
}
const mocha = new Mocha({ ui, reporter: function () {} });
mocha.addFile(testFile);
screenshots.takeScreenshotsOfFailedHooks(mocha.suite);
try {
	const runner = mocha.run(() => fs.writeFileSync(resultFile, JSON.stringify(result)));
	runner.on('pass', (test) => result.passed.push(test.fullTitle()));
	runner.on('fail', (test, error) => result.failed.push(test.fullTitle() + ': ' + error.message));
	runner.on('pending', (test) => result.pending.push(test.fullTitle()));
} catch (error) {
	result.loadError = String(error);
	fs.writeFileSync(resultFile, JSON.stringify(result));
}
`;

/** The functions of the Mocha interfaces the tests use: suites, tests, and hooks of each kind. */
const INTERFACES = {
	bdd: { suite: 'describe', test: 'it', beforeAll: 'before', beforeEach: 'beforeEach', afterEach: 'afterEach', afterAll: 'after' },
	tdd: { suite: 'suite', test: 'test', beforeAll: 'suiteSetup', beforeEach: 'setup', afterEach: 'teardown', afterAll: 'suiteTeardown' },
	qunit: { suite: 'suite', test: 'test', beforeAll: 'before', beforeEach: 'beforeEach', afterEach: 'afterEach', afterAll: 'after' },
};

/** Imports ExTester's hooks in a test file. */
const IMPORT_HOOKS = `const { before, beforeEach, afterEach, after } = require(${JSON.stringify(EXTESTER)});`;

describe('ExTester Mocha hooks', function () {
	this.timeout(30_000);
	let folder: string;
	let fileCount = 0;

	before(async () => {
		folder = await fs.mkdtemp(path.join(os.tmpdir(), 'extester-hooks-'));
		await fs.writeFile(path.join(folder, 'runner.js'), RUNNER);
	});

	after(async () => {
		await fs.remove(folder);
	});

	/**
	 * Runs a test file with Mocha in a new Node.js process, as extest runs one Mocha per process. In
	 * this process, Mocha already defines the hooks of its BDD interface for the tests here, and they
	 * would hide the hooks of another interface.
	 */
	async function runMocha(ui: string, lines: string[], screenshot: ScreenshotOptions = {}): Promise<MochaResult> {
		const testFile = path.join(folder, `${ui}-${++fileCount}.js`);
		const resultFile = `${testFile}.json`;
		await fs.writeFile(testFile, lines.join('\n'));
		const args = [
			require.resolve('mocha'),
			EXTESTER,
			HOOK_SCREENSHOTS,
			ui,
			testFile,
			resultFile,
			String(screenshot.delay ?? 0),
			String(screenshot.limit ?? ''),
		];
		await promisify(execFile)(process.execPath, [path.join(folder, 'runner.js'), ...args]);
		return fs.readJson(resultFile) as Promise<MochaResult>;
	}

	function result(fields: Partial<MochaResult>): MochaResult {
		return { passed: [], failed: [], pending: [], screenshots: [], ...fields };
	}

	for (const ui of ['bdd', 'tdd'] as const) {
		const { suite, test } = INTERFACES[ui];

		it(`runs ExTester's hooks with Mocha's ${ui.toUpperCase()} interface`, async () => {
			const actual = await runMocha(ui, [
				"const assert = require('assert');",
				IMPORT_HOOKS,
				'const calls = [];',
				`${suite}('Hooks', function () {`,
				"	before(function () { calls.push('before all'); });",
				"	beforeEach('named', function () { calls.push('before each'); });",
				"	afterEach(function () { calls.push('after each'); });",
				"	after(function () { calls.push('after all'); });",
				`	${test}('first', function () { assert.deepStrictEqual(calls, ['before all', 'before each']); });`,
				`	${test}('second', function () { assert.deepStrictEqual(calls, ['before all', 'before each', 'after each', 'before each']); });`,
				'});',
				`${suite}('Check', function () {`,
				`	${test}('ran every hook', function () {`,
				"		assert.deepStrictEqual(calls, ['before all', 'before each', 'after each', 'before each', 'after each', 'after all']);",
				'	});',
				'});',
			]);
			assert.deepStrictEqual(actual, result({ passed: ['Hooks first', 'Hooks second', 'Check ran every hook'] }));
		});

		it(`takes one screenshot when one of ExTester's hooks fails with Mocha's ${ui.toUpperCase()} interface, with the title Mocha gives the hook`, async () => {
			const actual = await runMocha(ui, [
				IMPORT_HOOKS,
				`${suite}('Failing', function () {`,
				"	beforeEach('prepares', function () { throw new Error('failed'); });",
				`	${test}('works', function () {});`,
				'});',
				`${suite}('Failing named', function () {`,
				"	before(function openEditor() { throw new Error('failed'); });",
				`	${test}('works', function () {});`,
				'});',
			]);
			assert.deepStrictEqual(
				actual,
				result({
					failed: ['Failing "before each" hook: prepares for "works": failed', 'Failing named "before all" hook: openEditor for "works": failed'],
					screenshots: ['Failing.before each hook prepares for works', 'Failing named.before all hook openEditor for works'],
				}),
			);
		});
	}

	for (const ui of ['bdd', 'tdd', 'qunit'] as const) {
		it(`takes one screenshot for each kind of hook that fails with Mocha's ${ui.toUpperCase()} interface, without importing ExTester's hooks`, async () => {
			const functions = INTERFACES[ui];
			const lines = (['beforeAll', 'beforeEach', 'afterEach', 'afterAll'] as const).flatMap((kind) => {
				const hook = `${functions[kind]}('fails', async function () { throw new Error('failed'); });`;
				const test = `${functions.test}('works', function () {});`;
				// QUnit suites have no callback: the hooks and tests after one belong to it.
				return ui === 'qunit' ? [`suite('${kind}');`, hook, test] : [`${functions.suite}('${kind}', function () {`, `	${hook}`, `	${test}`, '});'];
			});
			const actual = await runMocha(ui, lines);
			assert.deepStrictEqual(
				actual,
				result({
					passed: ['afterEach works', 'afterAll works'],
					failed: [
						'beforeAll "before all" hook: fails for "works": failed',
						'beforeEach "before each" hook: fails for "works": failed',
						'afterEach "after each" hook: fails for "works": failed',
						'afterAll "after all" hook: fails for "works": failed',
					],
					screenshots: [
						'beforeAll.before all hook fails for works',
						'beforeEach.before each hook fails for works',
						'afterEach.after each hook fails for works',
						'afterAll.after all hook fails for works',
					],
				}),
			);
		});
	}

	it('takes one screenshot when a hook of the exports interface fails', async () => {
		const actual = await runMocha('exports', ['module.exports = {', "	Failing: { beforeEach() { throw new Error('failed'); }, works() {} },", '};']);
		assert.deepStrictEqual(
			actual,
			// Mocha titles the hook after the name of the method, `beforeEach`.
			result({ failed: ['Failing "before each" hook: beforeEach for "works": failed'], screenshots: ['Failing.before each hook beforeEach for works'] }),
		);
	});

	it('passes done to the hooks that take it, and takes a screenshot when they report an error', async () => {
		const actual = await runMocha('bdd', [
			IMPORT_HOOKS,
			"describe('Done', function () {",
			'	before(function (done) { setTimeout(done, 10); });',
			'	beforeEach(function (done) { setTimeout(done, 10); });',
			"	it('works', function () {});",
			'});',
			"describe('Done with an error', function () {",
			"	before(function (done) { setTimeout(() => done(new Error('failed')), 10); });",
			"	it('works', function () {});",
			'});',
		]);
		assert.deepStrictEqual(
			actual,
			result({
				passed: ['Done works'],
				failed: ['Done with an error "before all" hook for "works": failed'],
				screenshots: ['Done with an error.before all hook for works'],
			}),
		);
	});

	it('fails a hook that takes done and throws a falsy value, as Mocha does', async () => {
		const actual = await runMocha('bdd', [
			"describe('Falsy', function () {",
			'	before(function (done) { throw undefined; });',
			"	it('works', function () {});",
			'});',
		]);
		assert.deepStrictEqual(actual.passed, []);
		assert.strictEqual(actual.failed.length, 1);
		assert.match(actual.failed[0], /^Falsy "before all" hook for "works": .*falsy/);
	});

	it('takes no screenshot when a hook skips the tests', async () => {
		const actual = await runMocha('bdd', [
			IMPORT_HOOKS,
			"describe('Skipped by an ExTester hook', function () {",
			'	beforeEach(function () { this.skip(); });',
			"	it('works', function () {});",
			'});',
			"describe('Skipped by a hook that takes done', function () {",
			'	before(function (done) { this.skip(); });',
			"	it('works', function () {});",
			'});',
			"describe('Skipped by an async hook', function () {",
			'	before(async function () { this.skip(); });',
			"	it('works', function () {});",
			'});',
		]);
		assert.deepStrictEqual(actual.failed, []);
		assert.deepStrictEqual(actual.screenshots, []);
		assert.deepStrictEqual(actual.pending.sort(), [
			'Skipped by a hook that takes done works',
			'Skipped by an ExTester hook works',
			'Skipped by an async hook works',
		]);
	});

	/** A hook that fails shortly before its timeout, and a check that its timeout is the same afterwards. */
	const FAILS_BEFORE_TIMEOUT = [
		"describe('Slow', function () {",
		'	beforeEach(async function () {',
		'		this.timeout(500);',
		'		await new Promise((resolve) => setTimeout(resolve, 400));',
		"		throw new Error('element not found');",
		'	});',
		"	it('works', function () {});",
		'	after(function () {',
		'		const timeout = this.test.parent._beforeEach[0].timeout();',
		"		if (timeout !== 500) throw new Error('the timeout of the hook is now ' + timeout);",
		'	});',
		'});',
	];

	it('reports the error of a hook, not a timeout, when its screenshot takes the rest of its time', async () => {
		const actual = await runMocha('bdd', FAILS_BEFORE_TIMEOUT, { delay: 300 });
		assert.deepStrictEqual(
			actual,
			result({ failed: ['Slow "before each" hook for "works": element not found'], screenshots: ['Slow.before each hook for works'] }),
		);
	});

	it('gives up a screenshot that does not end, and reports the error of the hook', async () => {
		const actual = await runMocha('bdd', FAILS_BEFORE_TIMEOUT, { delay: 'never', limit: 300 });
		assert.deepStrictEqual(
			actual,
			result({ failed: ['Slow "before each" hook for "works": element not found'], screenshots: ['Slow.before each hook for works'] }),
		);
	});

	it('takes no screenshot when a hook fails after its timeout, while another hook runs', async () => {
		const actual = await runMocha('bdd', [
			"describe('Late', function () {",
			'	before(async function () {',
			'		this.timeout(200);',
			'		await new Promise((resolve) => setTimeout(resolve, 500));',
			"		throw new Error('failed late');",
			'	});',
			"	it('works', function () {});",
			'	after(async function cleanUp() {',
			'		await new Promise((resolve) => setTimeout(resolve, 800));',
			'	});',
			'});',
		]);
		assert.deepStrictEqual(actual.screenshots, []);
		assert.strictEqual(actual.failed.length, 1);
		assert.match(actual.failed[0], /^Late "before all" hook for "works": Timeout of 200ms exceeded/);
	});

	it("explains that Mocha defines no hooks for ExTester's hooks in its exports interface", async () => {
		const actual = await runMocha('exports', [`require(${JSON.stringify(EXTESTER)}).before(function () {});`, 'module.exports = {};']);
		assert.match(actual.loadError ?? '', /Mocha defines neither before\(\) nor suiteSetup\(\)/);
	});

	it("types this in the callbacks of ExTester's hooks as Mocha's context", () => {
		// Compiling this file is the check: with callbacks typed as `Function`, `this` would implicitly be
		// `any`. The function is not called, so that the hooks are not added to this test run.
		const useEachOverload = () => {
			extesterBefore(function (done) {
				this.timeout(5000);
				done();
			});
			extesterBefore(async function () {
				this.timeout(5000);
			});
			extesterBeforeEach('named', function (done) {
				this.timeout(5000);
				done();
			});
			extesterAfter('named', async function () {
				this.timeout(5000);
			});
		};
		assert.strictEqual(typeof useEachOverload, 'function');
	});
});
