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

import * as path from 'node:path';
import { pathToFileURL } from 'node:url';
import { exitCode, GlobalFixturesState, resolveFromProject, RunContext, TestRunnerAdapter, TestRunnerOptions } from '../adapter';
import { VitePlugin, VitestCliOptions, VitestNodeModule, VitestRunResult } from './vitestApi';
import { SESSION_KEY } from './worker';

/** Environment variable selecting tests by name, like `MOCHA_GREP` (which is accepted too) */
export const GREP_ENV = 'EXTESTER_GREP';

/** Default timeouts for UI tests; Vitest's own (5 s / 10 s) are too short to drive a VS Code window */
const DEFAULT_TEST_TIMEOUT = 60_000;
const DEFAULT_HOOK_TIMEOUT = 120_000;

/**
 * Packages that must load natively in the workers, never through Vite: the test files and
 * the setup file have to share one `VSBrowser` and one set of page objects. Matches both the
 * installed packages and the packages of the ExTester monorepo, linked by npm workspaces.
 */
export const EXTERNAL_PACKAGES = [
	/[\\/]node_modules[\\/]vscode-extension-tester[\\/]/,
	/[\\/]node_modules[\\/]@redhat-developer[\\/](page-objects|locators)[\\/]/,
	/[\\/]packages[\\/](extester|page-objects|locators)[\\/]out[\\/]/,
];

/**
 * Runs the tests with Vitest (experimental). Vitest runs every test file in a worker process,
 * so VS Code cannot live in the test files' process: the ExTester process starts it, shares the
 * WebDriver session with the workers through Vitest's `provide`/`inject`, and shuts it down once
 * Vitest finishes. Test files run one at a time, as there is a single VS Code window.
 */
export class VitestAdapter implements TestRunnerAdapter {
	readonly name = 'vitest';
	readonly loadsTestFilesInProcess = false;
	private readonly configFile?: string;

	constructor(options: TestRunnerOptions = {}) {
		this.configFile = options.configFile;
	}

	async run({ testFiles, browser, workbench }: RunContext): Promise<number> {
		const { createVitest } = (await import(pathToFileURL(resolveFromProject('vitest/node', 'vitest')).href)) as VitestNodeModule;
		const state: GlobalFixturesState = { setupFailed: false, teardownFailed: false };

		// resolve the configuration before VS Code starts, so a broken config fails fast
		const vitest = await createVitest(vitestCliOptions(this.configFile), { plugins: [extesterPlugin()] });
		let failures = 0;
		try {
			try {
				await workbench.setup();
			} catch (err) {
				state.setupFailed = true;
				console.error('Error in global setup:', err);
			}

			if (!state.setupFailed) {
				const session = await browser.getSessionInfo();
				for (const project of vitest.projects) {
					project.provide(SESSION_KEY, session);
				}
				await vitest.standalone();
				const project = vitest.getRootProject();
				const specifications = testFiles.map((file) => project.createSpecification(path.resolve(file)));
				failures = countFailures(await vitest.runTestSpecifications(specifications, true));
			}
		} finally {
			try {
				await workbench.teardown();
			} catch (err) {
				console.error('Error shutting down the workbench:', err);
				state.teardownFailed = true;
			}
			await vitest.close();
		}
		return exitCode(failures, state);
	}
}

/**
 * Options ExTester passes to Vitest as if given on its command line: a single run, the
 * configuration file and the test name filter.
 * @param configFile explicit Vitest configuration file, `undefined` to let Vitest find one
 */
export function vitestCliOptions(configFile: string | undefined): VitestCliOptions {
	const grep = process.env[GREP_ENV] || process.env.MOCHA_GREP;
	return {
		run: true,
		watch: false,
		config: configFile ? path.resolve(configFile) : undefined,
		testNamePattern: grep || undefined,
	};
}

/**
 * Vite plugin applying what ExTester needs on top of the user's Vitest configuration:
 * the setup file attaching the workers to VS Code, one test file at a time, natively loaded
 * ExTester packages, and UI-test timeouts unless the user chose their own.
 */
export function extesterPlugin(): VitePlugin {
	return {
		name: 'vscode-extension-tester',
		config(userConfig) {
			const test = userConfig.test ?? {};
			return {
				test: {
					setupFiles: [path.join(__dirname, 'setup.mjs')],
					fileParallelism: false,
					maxWorkers: 1,
					testTimeout: test.testTimeout ?? DEFAULT_TEST_TIMEOUT,
					hookTimeout: test.hookTimeout ?? DEFAULT_HOOK_TIMEOUT,
					server: { deps: { external: EXTERNAL_PACKAGES } },
				},
			};
		},
	};
}

/**
 * Count what failed in a Vitest run: failed tests, plus test files that failed without a
 * failed test (e.g. a failing import or `beforeAll` hook), plus unhandled errors
 * @param result result of the run
 */
export function countFailures(result: VitestRunResult): number {
	let failures = result.unhandledErrors.length;
	for (const module of result.testModules) {
		const failedTests = [...module.children.allTests('failed')].length;
		failures += failedTests > 0 ? failedTests : Number(module.state() === 'failed');
	}
	return failures;
}
