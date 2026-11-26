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

/** The compiled module that exports ExTester's hooks and `VSBrowser`. */
const EXTESTER = path.resolve(__dirname, '..', 'extester');

/** What a Mocha run reported, and the screenshots that ExTester's hooks took. */
interface MochaResult {
	passed: string[];
	failed: string[];
	screenshots: string[];
	/** The error thrown while Mocha loaded the test file. */
	loadError?: string;
}

/**
 * Runs Mocha on one test file and writes a {@link MochaResult} to a file. `VSBrowser` is replaced by
 * a stand-in that records the names of the screenshots it is asked to take.
 * Arguments: path of Mocha, path of ExTester, `ui`, test file, result file.
 */
const RUNNER = `
const fs = require('fs');
const [mochaPath, extester, ui, testFile, resultFile] = process.argv.slice(2);
const Mocha = require(mochaPath);
const { VSBrowser } = require(extester);
const result = { passed: [], failed: [], screenshots: [] };
VSBrowser._instance = { takeScreenshot: async (name) => result.screenshots.push(name) };
const mocha = new Mocha({ ui, reporter: function () {} });
mocha.addFile(testFile);
try {
	const runner = mocha.run(() => fs.writeFileSync(resultFile, JSON.stringify(result)));
	runner.on('pass', (test) => result.passed.push(test.fullTitle()));
	runner.on('fail', (test, error) => result.failed.push(test.fullTitle() + ': ' + error.message));
} catch (error) {
	result.loadError = String(error);
	fs.writeFileSync(resultFile, JSON.stringify(result));
}
`;

/** The suite and test functions of the Mocha interfaces the tests use. */
const INTERFACES = {
	bdd: { suite: 'describe', test: 'it' },
	tdd: { suite: 'suite', test: 'test' },
};

/** ExTester's hooks under the names of each interface, in the order: before all, before each, after each, after all. */
const HOOK_NAMES = {
	bdd: ['before', 'beforeEach', 'afterEach', 'after'],
	tdd: ['suiteSetup', 'setup', 'teardown', 'suiteTeardown'],
};

describe('ExTester Mocha hooks', function () {
	this.timeout(30_000);
	let folder: string;

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
	async function runMocha(ui: string, source: string): Promise<MochaResult> {
		const testFile = path.join(folder, `${ui}-${Date.now()}.js`);
		const resultFile = `${testFile}.json`;
		await fs.writeFile(testFile, source);
		await promisify(execFile)(process.execPath, [path.join(folder, 'runner.js'), require.resolve('mocha'), EXTESTER, ui, testFile, resultFile]);
		return fs.readJson(resultFile) as Promise<MochaResult>;
	}

	for (const ui of ['bdd', 'tdd'] as const) {
		for (const names of ['bdd', 'tdd'] as const) {
			it(`runs the hooks named as in ${names.toUpperCase()} with Mocha's ${ui.toUpperCase()} interface`, async () => {
				const { suite, test } = INTERFACES[ui];
				const [beforeAll, beforeEach, afterEach, afterAll] = HOOK_NAMES[names];
				const result = await runMocha(
					ui,
					[
						"const assert = require('assert');",
						`const { ${HOOK_NAMES[names].join(', ')} } = require(${JSON.stringify(EXTESTER)});`,
						'const calls = [];',
						`${suite}('Hooks', function () {`,
						`	${beforeAll}(function () { calls.push('before all'); });`,
						`	${beforeEach}('named', function () { calls.push('before each'); });`,
						`	${afterEach}(function () { calls.push('after each'); });`,
						`	${afterAll}(function () { calls.push('after all'); });`,
						`	${test}('first', function () { assert.deepStrictEqual(calls, ['before all', 'before each']); });`,
						`	${test}('second', function () { assert.deepStrictEqual(calls, ['before all', 'before each', 'after each', 'before each']); });`,
						'});',
						`${suite}('Check', function () {`,
						`	${test}('ran every hook', function () {`,
						"		assert.deepStrictEqual(calls, ['before all', 'before each', 'after each', 'before each', 'after each', 'after all']);",
						'	});',
						'});',
					].join('\n'),
				);
				assert.deepStrictEqual(result, { passed: ['Hooks first', 'Hooks second', 'Check ran every hook'], failed: [], screenshots: [] });
			});
		}
	}

	it("takes a screenshot when a hook fails with Mocha's TDD interface", async () => {
		const result = await runMocha(
			'tdd',
			[
				`const { setup } = require(${JSON.stringify(EXTESTER)});`,
				"suite('Failing', function () {",
				"	setup('prepares', function () { throw new Error('setup failed'); });",
				"	test('works', function () {});",
				'});',
			].join('\n'),
		);
		assert.deepStrictEqual(result, {
			passed: [],
			failed: ['Failing "before each" hook: prepares for "works": setup failed'],
			screenshots: ['Failing.before each hook prepares for works'],
		});
	});

	it('explains that Mocha defines no hooks for its exports interface', async () => {
		const result = await runMocha('exports', [`require(${JSON.stringify(EXTESTER)}).before(function () {});`, 'module.exports = {};'].join('\n'));
		assert.match(result.loadError ?? '', /Mocha defines neither before\(\) nor suiteSetup\(\)/);
	});
});
