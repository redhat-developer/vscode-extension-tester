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
export const TEST_RUNNERS = ['mocha', 'vitest'] as const;

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
		case 'vitest': {
			const { VitestAdapter } = require('./vitest/vitestAdapter') as typeof import('./vitest/vitestAdapter');
			return new VitestAdapter(options);
		}
		default:
			throw new Error(`Unknown test runner "${String(name)}"`);
	}
}

/**
 * Check, without loading it, that the test framework is installed, so a missing one is reported
 * before VS Code is downloaded and the extension installed
 * @param name test runner
 */
export function assertTestRunnerAvailable(name: TestRunnerName): void {
	if (name === 'vitest') {
		resolveFromProject('vitest/node', 'vitest');
	}
	// Mocha is resolved from ExTester itself, as before; a missing one is reported when the run starts
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

/**
 * Resolve a package from the project under test (the current working directory) rather than
 * from ExTester's own folder, so the project's own copy of the test framework is used.
 * @param request module to resolve, e.g. `mocha` or `vitest/node`
 * @param installHint package to tell the user to install
 * @throws an actionable error when the package is not installed
 */
export function resolveFromProject(request: string, installHint: string): string {
	const { createRequire } = require('node:module') as typeof import('node:module');
	const path = require('node:path') as typeof import('node:path');
	const projectRequire = createRequire(path.join(process.cwd(), 'package.json'));
	try {
		return projectRequire.resolve(request);
	} catch (error) {
		const code = (error as NodeJS.ErrnoException).code;
		if (code !== 'MODULE_NOT_FOUND' && code !== 'ERR_PACKAGE_PATH_NOT_EXPORTED') {
			throw error;
		}
		throw new Error(
			`ExTester cannot find "${request}" from "${process.cwd()}". The selected test runner needs it installed in the package containing your tests:\n` +
				`  npm install --save-dev ${installHint}`,
		);
	}
}

/** Run options that choose and configure the test runner */
export interface TestRunnerSelectionOptions {
	/** test runner name, `mocha` by default */
	testRunner?: string;
	/** Mocha configuration file */
	config?: string;
	/** Vitest configuration file */
	vitestConfig?: string;
	/** whether the hidden window mode is requested through the run options */
	hiddenWindow?: boolean;
}

/** The chosen test runner and its configuration file */
export interface TestRunnerSelection {
	name: TestRunnerName;
	configFile?: string;
}

/**
 * Choose the test runner of a run and check the options fit it
 * @param options run options
 * @param hiddenWindowRequested whether the hidden window mode is requested in another way (e.g. its environment variable)
 * @throws when the runner is unknown, or Vitest is combined with the hidden window mode
 */
export function selectTestRunner(options: TestRunnerSelectionOptions, hiddenWindowRequested = false): TestRunnerSelection {
	const name = parseTestRunner(options.testRunner);
	if (name === 'mocha') {
		if (options.vitestConfig) {
			console.log('\x1b[33m%s\x1b[0m', `WARNING: the Vitest configuration ${options.vitestConfig} is ignored, the tests run with Mocha`);
		}
		return { name, configFile: options.config };
	}
	if (options.hiddenWindow || hiddenWindowRequested) {
		throw new Error(
			'The hidden window mode is not supported with the Vitest test runner yet: Vitest runs the tests in worker processes, which cannot restart VS Code. Run without --hidden_window, or with Mocha.',
		);
	}
	if (options.config) {
		console.log('\x1b[33m%s\x1b[0m', `WARNING: the Mocha configuration ${options.config} is ignored, the tests run with Vitest`);
	}
	return { name, configFile: options.vitestConfig };
}
