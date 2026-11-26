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
import type { beforeEach as extesterBeforeEach } from '../suite/mochaHooks';

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

/**
 * Runs Mocha on one test file as `extest` does: every hook of the test file takes a screenshot when it
 * fails. `VSBrowser` is replaced by a stand-in that records the names of the screenshots it is asked to
 * take. Writes a {@link MochaResult} to a file.
 * Arguments: path of Mocha, path of ExTester, path of the hook screenshots module, `ui`, test file, result file.
 */
const RUNNER = `
const fs = require('fs');
const [mochaPath, extester, hookScreenshots, ui, testFile, resultFile] = process.argv.slice(2);
const Mocha = require(mochaPath);
const { VSBrowser } = require(extester);
const result = { passed: [], failed: [], pending: [], screenshots: [] };
VSBrowser._instance = { takeScreenshot: async (name) => result.screenshots.push(name) };
const mocha = new Mocha({ ui, reporter: function () {} });
mocha.addFile(testFile);
require(hookScreenshots).takeScreenshotsOfFailedHooks(mocha.suite);
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

/** The suite and test functions, and the before each hook, of the Mocha interfaces the tests use. */
const INTERFACES = {
	bdd: { suite: 'describe', test: 'it', beforeEach: 'beforeEach' },
	tdd: { suite: 'suite', test: 'test', beforeEach: 'setup' },
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
	async function runMocha(ui: string, ...lines: string[]): Promise<MochaResult> {
		const testFile = path.join(folder, `${ui}-${++fileCount}.js`);
		const resultFile = `${testFile}.json`;
		await fs.writeFile(testFile, lines.join('\n'));
		const runner = path.join(folder, 'runner.js');
		await promisify(execFile)(process.execPath, [runner, require.resolve('mocha'), EXTESTER, HOOK_SCREENSHOTS, ui, testFile, resultFile]);
		return fs.readJson(resultFile) as Promise<MochaResult>;
	}

	function result(fields: Partial<MochaResult>): MochaResult {
		return { passed: [], failed: [], pending: [], screenshots: [], ...fields };
	}

	for (const ui of ['bdd', 'tdd'] as const) {
		const { suite, test } = INTERFACES[ui];

		it(`runs ExTester's hooks with Mocha's ${ui.toUpperCase()} interface`, async () => {
			const actual = await runMocha(
				ui,
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
			);
			assert.deepStrictEqual(actual, result({ passed: ['Hooks first', 'Hooks second', 'Check ran every hook'] }));
		});

		it(`takes one screenshot when a hook fails with Mocha's ${ui.toUpperCase()} interface, without importing ExTester's hooks`, async () => {
			const actual = await runMocha(
				ui,
				`${suite}('Failing', function () {`,
				`	${INTERFACES[ui].beforeEach}('prepares', async function () { throw new Error('failed'); });`,
				`	${test}('works', function () {});`,
				'});',
			);
			assert.deepStrictEqual(
				actual,
				result({
					failed: ['Failing "before each" hook: prepares for "works": failed'],
					screenshots: ['Failing.before each hook prepares for works'],
				}),
			);
		});
	}

	it('takes one screenshot when a hook of the exports interface fails', async () => {
		const actual = await runMocha('exports', 'module.exports = {', "	Failing: { beforeEach() { throw new Error('failed'); }, works() {} },", '};');
		assert.deepStrictEqual(
			actual,
			// Mocha titles the hook after the name of the method, `beforeEach`.
			result({ failed: ['Failing "before each" hook: beforeEach for "works": failed'], screenshots: ['Failing.before each hook beforeEach for works'] }),
		);
	});

	it("takes one screenshot when one of ExTester's hooks fails, with the title Mocha gives the hook", async () => {
		const actual = await runMocha(
			'bdd',
			IMPORT_HOOKS,
			"describe('Failing', function () {",
			"	beforeEach('prepares', function () { throw new Error('failed'); });",
			"	it('works', function () {});",
			'});',
			"describe('Failing named', function () {",
			"	before(function openEditor() { throw new Error('failed'); });",
			"	it('works', function () {});",
			'});',
		);
		assert.deepStrictEqual(
			actual,
			result({
				failed: ['Failing "before each" hook: prepares for "works": failed', 'Failing named "before all" hook: openEditor for "works": failed'],
				screenshots: ['Failing.before each hook prepares for works', 'Failing named.before all hook openEditor for works'],
			}),
		);
	});

	it('passes done to the hooks that take it, and takes a screenshot when they report an error', async () => {
		const actual = await runMocha(
			'bdd',
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
		);
		assert.deepStrictEqual(
			actual,
			result({
				passed: ['Done works'],
				failed: ['Done with an error "before all" hook for "works": failed'],
				screenshots: ['Done with an error.before all hook for works'],
			}),
		);
	});

	it('takes no screenshot when a hook skips the tests', async () => {
		const actual = await runMocha(
			'bdd',
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
		);
		assert.deepStrictEqual(actual.failed, []);
		assert.deepStrictEqual(actual.screenshots, []);
		assert.deepStrictEqual(actual.pending.sort(), [
			'Skipped by a hook that takes done works',
			'Skipped by an ExTester hook works',
			'Skipped by an async hook works',
		]);
	});

	it("explains that Mocha defines no hooks for ExTester's hooks in its exports interface", async () => {
		const actual = await runMocha('exports', `require(${JSON.stringify(EXTESTER)}).before(function () {});`, 'module.exports = {};');
		assert.match(actual.loadError ?? '', /Mocha defines neither before\(\) nor suiteSetup\(\)/);
	});

	it("types this in the callbacks of ExTester's hooks as Mocha's context", () => {
		// Compiling this file is the check: with callbacks typed as `Function`, `this` would implicitly be `any`.
		const callback: Parameters<typeof extesterBeforeEach>[1] = async function () {
			this.timeout(5000);
		};
		assert.strictEqual(typeof callback, 'function');
	});
});
