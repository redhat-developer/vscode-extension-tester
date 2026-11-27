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

import type { VSBrowser } from '../browser';

/** Test frameworks ExTester can run the UI tests with */
export const TEST_RUNNERS = ['mocha'] as const;

/** Name of a test framework ExTester can run the UI tests with */
export type TestRunnerName = (typeof TEST_RUNNERS)[number];

/** Test framework used when none is configured */
export const DEFAULT_TEST_RUNNER: TestRunnerName = 'mocha';

/**
 * Validate a test runner name coming from the CLI, `extester.config.json` or the API.
 * @param value requested test runner, `undefined` for the default one
 * @returns the test runner name
 * @throws when the value names no supported test runner
 */
export function parseTestRunner(value: string | undefined): TestRunnerName {
	if (value === undefined || value === '') {
		return DEFAULT_TEST_RUNNER;
	}
	const name = value.trim().toLowerCase();
	if ((TEST_RUNNERS as readonly string[]).includes(name)) {
		return name as TestRunnerName;
	}
	throw new Error(`Unknown test runner "${value}". Use one of: ${TEST_RUNNERS.join(', ')}.`);
}

/** Callbacks starting and stopping the VS Code workbench around the test run */
export interface WorkbenchLifecycle {
	/** start VS Code and ChromeDriver and wait for the workbench */
	setup: () => Promise<void>;
	/** quit VS Code and ChromeDriver, write coverage, remove temporary files */
	teardown: () => Promise<void>;
}

/** Everything a test runner adapter needs for one run */
export interface RunContext {
	/** test files to run, already expanded from the glob patterns and in run order */
	testFiles: string[];
	/** the browser the workbench lifecycle starts and stops */
	browser: VSBrowser;
	/** starts and stops VS Code; the adapter decides when to call it, and must always call the teardown once the setup ran */
	workbench: WorkbenchLifecycle;
}

/** Outcome of the workbench setup and teardown, filled in while the test runner runs them */
export interface GlobalFixturesState {
	/** whether starting the workbench or a user-provided global setup fixture failed */
	setupFailed: boolean;
	/** error thrown while starting the workbench or by a user-provided global setup fixture */
	setupError?: unknown;
	/** whether a user-provided global teardown fixture or the workbench shutdown failed */
	teardownFailed: boolean;
}

/**
 * Compute the exit code of a test run
 * @param failures number of failed tests and hooks reported by the test runner
 * @param state outcome of the workbench setup and teardown
 * @returns 1 if a test, a hook, the setup or the teardown failed, 0 otherwise
 */
export function exitCode(failures: number, state: GlobalFixturesState): number {
	return failures > 0 || state.setupFailed || state.teardownFailed ? 1 : 0;
}

/**
 * Bridge between ExTester and one test framework. ExTester owns VS Code: it prepares the
 * browser and hands over the workbench lifecycle; the adapter loads the test files, hooks
 * the lifecycle into the framework, takes screenshots of failures and reports the exit code.
 */
export interface TestRunnerAdapter {
	readonly name: TestRunnerName;
	/** whether the test files are loaded into the ExTester process, so its TypeScript loader must cover them */
	readonly loadsTestFilesInProcess: boolean;
	/** run the tests, resolving to the exit code of the run */
	run(context: RunContext): Promise<number>;
}

/** Options shared by the adapters */
export interface TestRunnerOptions {
	/** path to the framework's configuration file, `undefined` to look up the default one */
	configFile?: string;
}

/**
 * Create the adapter of a test runner. Each adapter is loaded on demand, so only the
 * framework that is actually used needs to be installed.
 * @param name test runner to create
 * @param options adapter options
 */
export function createTestRunnerAdapter(name: TestRunnerName, options: TestRunnerOptions = {}): TestRunnerAdapter {
	switch (name) {
		case 'mocha': {
			const { MochaAdapter } = loadAdapterModule(() => require('./mocha/mochaAdapter') as typeof import('./mocha/mochaAdapter'), 'mocha');
			return new MochaAdapter(options);
		}
		default:
			throw new Error(`Unknown test runner "${String(name)}"`);
	}
}

/**
 * Load an adapter module, turning a missing test framework into an actionable error.
 * @param load loads the adapter module, which imports the framework
 * @param framework package of the framework
 */
function loadAdapterModule<T>(load: () => T, framework: string): T {
	try {
		return load();
	} catch (error) {
		const err = error as NodeJS.ErrnoException;
		if (err.code === 'MODULE_NOT_FOUND' && err.message.includes(`'${framework}'`)) {
			throw new Error(
				`ExTester cannot find "${framework}". The selected test runner needs it installed in the package containing your tests:\n` +
					`  npm install --save-dev ${framework}`,
			);
		}
		throw error;
	}
}
