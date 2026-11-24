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

/*
 * Preloaded into the `extest` process with `NODE_OPTIONS=--require`, so the Testing view can show
 * the result of each test. It does not change how tests run: when Mocha is loaded, it listens to
 * the events of each Mocha runner and appends one JSON line per event to the file named by
 * `EXTESTER_RUNNER_RESULTS`. It works with any ExTester version and any reporter.
 *
 * This file is bundled on its own and must not import `vscode`.
 */

import Module = require('node:module');
import { appendFileSync } from 'node:fs';
import { inspect } from 'node:util';

/** One line of the results file. */
export interface ResultEvent {
	event: 'started' | 'passed' | 'failed' | 'skipped' | 'output';
	/** Titles from the outermost `describe` block to the test, or to the suite of a failed hook. */
	titles: string[];
	/** Whether a hook (`before`, `afterEach`, ...) failed rather than a test. */
	hook?: boolean;
	file?: string;
	duration?: number;
	error?: { message: string; stack?: string; expected?: string; actual?: string };
	/** For `output`: text the process printed. `titles` is empty when no test was running. */
	text?: string;
}

interface MochaRunnable {
	type?: string;
	file?: string;
	duration?: number;
	titlePath(): string[];
	parent?: MochaRunnable;
}

interface MochaRunner {
	on(event: string, listener: (runnable: MochaRunnable, error?: unknown) => void): void;
}

const resultsFile = process.env.EXTESTER_RUNNER_RESULTS;

function stringify(value: unknown): string | undefined {
	if (value === undefined) {
		return undefined;
	}
	if (typeof value === 'string') {
		return value;
	}
	try {
		return JSON.stringify(value, undefined, 2);
	} catch {
		// Circular structures and BigInt values cannot be written as JSON.
		return inspect(value, { depth: 4 });
	}
}

function toError(error: unknown): ResultEvent['error'] {
	if (error instanceof Error) {
		const { expected, actual } = error as Error & { expected?: unknown; actual?: unknown };
		return { message: error.message, stack: error.stack, expected: stringify(expected), actual: stringify(actual) };
	}
	return { message: String(error) };
}

function writeEvent(event: ResultEvent): void {
	try {
		appendFileSync(resultsFile!, JSON.stringify(event) + '\n');
	} catch {
		// Results are a convenience; never let them break the test run.
	}
}

/** Titles of the test that runs now, so printed output can be attributed to it. */
let currentTest: string[] = [];

/**
 * Copies what the process prints to the results file, so the Testing view can show the output
 * of the run and of each test. The text is still printed as before.
 */
function captureOutput(stream: NodeJS.WriteStream): void {
	const write = stream.write.bind(stream) as (...args: unknown[]) => boolean;
	stream.write = function (chunk: unknown, ...rest: unknown[]): boolean {
		if (typeof chunk === 'string' || chunk instanceof Uint8Array) {
			const text = typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8');
			writeEvent({ event: 'output', titles: currentTest, text });
		}
		return write(chunk, ...rest);
	} as NodeJS.WriteStream['write'];
}

function listen(runner: MochaRunner): void {
	runner.on('test', (test) => (currentTest = test.titlePath()));
	runner.on('test end', () => (currentTest = []));
	const report = (event: ResultEvent['event']) => (test: MochaRunnable, error?: unknown) => {
		const hook = test.type === 'hook';
		writeEvent({
			event,
			titles: hook ? (test.parent?.titlePath() ?? []) : test.titlePath(),
			hook: hook || undefined,
			file: test.file,
			duration: test.duration,
			error: error === undefined ? undefined : toError(error),
		});
	};
	runner.on('test', report('started'));
	runner.on('pass', report('passed'));
	runner.on('fail', report('failed'));
	runner.on('pending', report('skipped'));
}

if (resultsFile) {
	captureOutput(process.stdout);
	captureOutput(process.stderr);
	const loader = Module as unknown as { _load: (request: string, ...rest: unknown[]) => unknown };
	const originalLoad = loader._load;
	let patched = false;
	loader._load = function (this: unknown, request: string, ...rest: unknown[]) {
		const exported = originalLoad.call(this, request, ...rest) as { Runner?: { prototype: { run: (...args: unknown[]) => unknown } } };
		if (!patched && request === 'mocha' && exported?.Runner) {
			patched = true;
			const run = exported.Runner.prototype.run;
			exported.Runner.prototype.run = function (this: MochaRunner, ...args: unknown[]) {
				listen(this);
				return run.apply(this, args);
			};
		}
		return exported;
	};
}
