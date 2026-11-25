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

import { strict as assert } from 'node:assert';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import * as vscode from 'vscode';
import { Logger } from '../../logger/logger';
import { hookRequireOption, nodeOptionsWithHook } from '../../testing/hookOption';
import type { ResultEvent } from '../../testing/resultHook';
import { Leaf, RunReporter } from '../../testing/runReporter';

const logger = { debug: () => undefined, info: () => undefined, error: () => undefined } as unknown as Logger;

/** A test run that records the last state of each test item and the messages of its failures. */
class RecordingRun {
	readonly states = new Map<string, string>();
	readonly messages = new Map<string, string[]>();

	asTestRun(): vscode.TestRun {
		const set = (state: string) => (item: vscode.TestItem, messages?: vscode.TestMessage | readonly vscode.TestMessage[] | number) => {
			this.states.set(item.id, state);
			// `passed` gets a duration instead of messages.
			const texts = [typeof messages === 'object' ? messages : []]
				.flat()
				.map((message) => (typeof message.message === 'string' ? message.message : message.message.value));
			this.messages.set(item.id, [...(this.messages.get(item.id) ?? []), ...texts]);
		};
		return {
			enqueued: set('enqueued'),
			started: set('started'),
			passed: set('passed'),
			skipped: set('skipped'),
			failed: set('failed'),
			errored: set('errored'),
			appendOutput: () => undefined,
		} as unknown as vscode.TestRun;
	}
}

/** Test items for a parsed file: `describe` blocks with their `it` tests, as the Testing view builds them. */
function buildTree(controller: vscode.TestController, suites: [string, string[]][]): { leaves: Leaf[]; suites: Map<string, vscode.TestItem> } {
	const leaves: Leaf[] = [];
	const suiteItems = new Map<string, vscode.TestItem>();
	for (const [suite, tests] of suites) {
		const suiteItem = controller.createTestItem(`describe::${suite}`, suite);
		controller.items.add(suiteItem);
		suiteItems.set(suite, suiteItem);
		tests.forEach((test, index) => {
			const item = controller.createTestItem(`it::${suite}::${test}::${index}`, test);
			suiteItem.children.add(item);
			leaves.push({ item, titles: [suite, test], done: false });
		});
	}
	return { leaves, suites: suiteItems };
}

describe('Testing view results', () => {
	let controller: vscode.TestController;
	let workDir: string;

	beforeEach(() => {
		controller = vscode.tests.createTestController('extesterRunnerReporterTest', 'Reporter test');
		workDir = mkdtempSync(path.join(tmpdir(), 'ert-reporter-'));
	});

	afterEach(() => {
		controller.dispose();
		rmSync(workDir, { recursive: true, force: true });
	});

	describe('result hook option', () => {
		it('uses forward slashes, which Node.js does not read as escape characters in NODE_OPTIONS', () => {
			assert.equal(hookRequireOption(String.raw`C:\Users\dev\ext\out\resultHook.js`), '--require "C:/Users/dev/ext/out/resultHook.js"');
		});

		it('keeps the NODE_OPTIONS the user configured', () => {
			assert.equal(
				nodeOptionsWithHook('--require "hook.js"', '--require ts-node/register', '--max-old-space-size=4096'),
				'--require ts-node/register --require "hook.js"',
			);
			assert.equal(nodeOptionsWithHook('--require "hook.js"', undefined, '--max-old-space-size=4096'), '--max-old-space-size=4096 --require "hook.js"');
			assert.equal(nodeOptionsWithHook('--require "hook.js"', undefined, undefined), '--require "hook.js"');
		});
	});

	describe('a Mocha run with the result hook', () => {
		/**
		 * Runs a Mocha suite in Node.js with the result hook loaded the way the Testing view loads it,
		 * and reports the events to the given test items.
		 */
		function runSuite(source: string, leaves: Leaf[]): { run: RecordingRun; reporter: RunReporter; exitCode: number } {
			const testFile = path.join(workDir, 'sample.test.js');
			const runnerFile = path.join(workDir, 'run.js');
			const resultsFile = path.join(workDir, 'results.jsonl');
			writeFileSync(testFile, source);
			// The hook patches Mocha when it is loaded as `mocha`, as extest loads it.
			writeFileSync(
				runnerFile,
				`const Mocha = require('mocha'); const mocha = new Mocha(); mocha.addFile(${JSON.stringify(testFile)}); mocha.run((failures) => (process.exitCode = failures ? 1 : 0));`,
			);
			const hookOption = hookRequireOption(path.resolve(__dirname, '../../testing/resultHook.js'));
			let exitCode = 0;
			try {
				execFileSync('node', [runnerFile], {
					cwd: workDir,
					env: {
						...process.env,
						NODE_PATH: path.dirname(path.dirname(require.resolve('mocha'))),
						ELECTRON_RUN_AS_NODE: undefined,
						EXTESTER_RUNNER_RESULTS: resultsFile,
						EXTESTER_RUNNER_HOOK_OPTION: hookOption,
						NODE_OPTIONS: nodeOptionsWithHook(hookOption, undefined, undefined),
					},
					stdio: 'pipe',
				});
			} catch (error) {
				exitCode = (error as { status?: number }).status ?? -1;
			}
			const lines = readFileSync(resultsFile, 'utf8').split('\n').filter(Boolean);
			const run = new RecordingRun();
			const reporter = new RunReporter(run.asTestRun(), leaves, undefined, Date.now(), logger);
			lines.forEach((line) => reporter.report(JSON.parse(line) as ResultEvent));
			reporter.flushFailures();
			return { run, reporter, exitCode };
		}

		it('fails a test in a loop when any of its runs fails', function () {
			this.timeout(30000);
			const { leaves } = buildTree(controller, [['Loop', ['works for ${n}']]]);
			const { run } = runSuite(
				`describe('Loop', () => { for (const n of [1, 2, 3]) { it(\`works for \${n}\`, () => { if (n === 2) throw new Error('broken ' + n); }); } });`,
				leaves,
			);
			assert.equal(run.states.get(leaves[0].item.id), 'failed');
			assert.ok(run.messages.get(leaves[0].item.id)?.includes('broken 2'));
		});

		it('reports two tests with the same title separately', function () {
			this.timeout(30000);
			const { leaves } = buildTree(controller, [['Same', ['repeats', 'repeats']]]);
			const { run } = runSuite(`describe('Same', () => { it('repeats', () => {}); it('repeats', () => { throw new Error('second'); }); });`, leaves);
			assert.equal(run.states.get(leaves[0].item.id), 'passed');
			assert.equal(run.states.get(leaves[1].item.id), 'failed');
		});

		it('fails the describe block when its after hook fails', function () {
			this.timeout(30000);
			const { leaves, suites } = buildTree(controller, [['After', ['passes']]]);
			const { run, reporter } = runSuite(
				`describe('After', () => { after(() => { throw new Error('after failed'); }); it('passes', () => {}); });`,
				leaves,
			);
			assert.equal(run.states.get(leaves[0].item.id), 'passed');
			assert.equal(run.states.get(suites.get('After')!.id), 'failed');
			assert.ok(reporter.hasFailures);
		});

		it('fails the test an afterEach hook ran for, and the tests Mocha then skips', function () {
			this.timeout(30000);
			const { leaves } = buildTree(controller, [['AfterEach', ['first', 'second']]]);
			const { run } = runSuite(
				`describe('AfterEach', () => { afterEach(() => { throw new Error('afterEach failed'); }); it('first', () => {}); it('second', () => {}); });`,
				leaves,
			);
			assert.equal(run.states.get(leaves[0].item.id), 'failed');
			assert.ok(run.messages.get(leaves[0].item.id)?.some((message) => message.includes('afterEach failed')));
			assert.equal(run.states.get(leaves[1].item.id), 'failed');
		});
	});

	describe('a failed run without a failed test', () => {
		it('errors the tests with the error of a hook that no test item stands for', () => {
			const { leaves, suites } = buildTree(controller, [['Root', ['passes']]]);
			const run = new RecordingRun();
			const reporter = new RunReporter(run.asTestRun(), leaves, undefined, Date.now(), logger);
			reporter.report({ event: 'started', titles: ['Root', 'passes'] });
			reporter.report({ event: 'passed', titles: ['Root', 'passes'] });
			reporter.report({ event: 'failed', titles: [], hook: true, hookType: 'after all', error: { message: 'root hook failed' } });
			reporter.report({ event: 'finished', titles: [] });
			reporter.reportRunFailure([suites.get('Root')!], 1);
			assert.equal(run.states.get(suites.get('Root')!.id), 'errored');
			assert.deepEqual(run.messages.get(suites.get('Root')!.id), ['root hook failed']);
		});

		it('errors the tests with the exit code when nothing explains the failure', () => {
			const { leaves, suites } = buildTree(controller, [['Crash', ['passes']]]);
			const run = new RecordingRun();
			const reporter = new RunReporter(run.asTestRun(), leaves, undefined, Date.now(), logger);
			reporter.report({ event: 'passed', titles: ['Crash', 'passes'] });
			reporter.reportRunFailure([suites.get('Crash')!], 3);
			assert.equal(run.states.get(suites.get('Crash')!.id), 'errored');
			assert.match(run.messages.get(suites.get('Crash')!.id)?.[0] ?? '', /exit code 3/);
		});

		it('leaves the run alone when a test failure is shown', () => {
			const { leaves, suites } = buildTree(controller, [['Fails', ['fails']]]);
			const run = new RecordingRun();
			const reporter = new RunReporter(run.asTestRun(), leaves, undefined, Date.now(), logger);
			reporter.report({ event: 'failed', titles: ['Fails', 'fails'], error: { message: 'nope' } });
			reporter.flushFailures();
			reporter.reportRunFailure([suites.get('Fails')!], 1);
			assert.equal(run.states.get(suites.get('Fails')!.id), undefined);
			assert.equal(run.states.get(leaves[0].item.id), 'failed');
		});
	});
});
