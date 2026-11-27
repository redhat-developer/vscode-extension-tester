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

import * as fs from 'fs-extra';
import { globSync } from 'glob';
import * as os from 'node:os';
import * as path from 'node:path';
import { logging } from 'selenium-webdriver';
import { VSBrowser } from '../browser';
import { CodeUtil, CustomPageObjectsOptions, ReleaseQuality, SeedFilesOptions } from '../util/codeUtil';
import { Coverage } from '../util/coverage';
import { registerTypeScript } from '../util/typescript';
import { createTestRunnerAdapter, DEFAULT_TEST_RUNNER, TestRunnerAdapter, TestRunnerName } from './adapter';

export { exitCode, GlobalFixturesState, WorkbenchLifecycle } from './adapter';

/**
 * Expand test file glob patterns into the ordered set of files the test runner will load
 * @param testFilesPattern glob patterns of test files, optionally wrapped in single quotes
 */
export function expandTestFiles(testFilesPattern: string[]): Set<string> {
	const testFiles = new Set<string>();
	for (const pattern of testFilesPattern) {
		const universalPattern = pattern.replace(/'/g, '');
		globSync(universalPattern)
			.reverse()
			.forEach((val) => testFiles.add(val));
	}
	return testFiles;
}

/**
 * All module paths ExTester loads before running tests: the test files plus the custom locators, if any
 */
export function withLocators(testFiles: Iterable<string>, customPageObjects?: CustomPageObjectsOptions): string[] {
	const locatorsPath = customPageObjects?.locatorsPath;
	return locatorsPath ? [...testFiles, locatorsPath] : [...testFiles];
}

/**
 * Build the message printed after a failed run, pointing to the failure screenshots.
 * Screenshots are only captured once VS Code is up (failed tests, or failed hooks wrapped
 * by ExTester), so failures before that (e.g. VS Code/ChromeDriver failing to start in the
 * root `before all` hook) leave no screenshots behind — advertising an empty folder there
 * sends users looking for files that were never written.
 * @param screenshotsDir folder the screenshots of this run are written to
 * @returns message to print
 */
export function screenshotsReport(screenshotsDir: string): string {
	let hasScreenshots = false;
	try {
		hasScreenshots = fs.readdirSync(screenshotsDir).length > 0;
	} catch {
		// folder was never created: no screenshot was taken
	}
	return hasScreenshots
		? `INFO: Screenshots of failures can be found in: ${screenshotsDir}`
		: 'INFO: No screenshots of failures were captured. Screenshots are taken only for failed tests and failed hooks imported from vscode-extension-tester while VS Code is running; see the errors above.';
}

/**
 * Runs the UI tests: owns the VS Code workbench (launch, shutdown, coverage, cleanup) and hands
 * its lifecycle to the adapter of the selected test runner, which loads and runs the test files.
 */
export class VSRunner {
	private readonly adapter: TestRunnerAdapter;
	private readonly chromeBin: string;
	private readonly customSettings: object;
	private readonly codeVersion: string;
	private readonly cleanup: boolean;
	private readonly releaseType: ReleaseQuality;
	private readonly customPageObjects?: CustomPageObjectsOptions;
	private readonly locale: string | undefined;
	private readonly seedFiles?: SeedFilesOptions;
	private readonly tmpLink = path.join(os.tmpdir(), 'extest-code');

	constructor(
		bin: string,
		codeVersion: string,
		releaseType: ReleaseQuality,
		config?: string,
		customPageObjects?: CustomPageObjectsOptions,
		customSettings: object = {},
		cleanup: boolean = false,
		locale?: string,
		seedFiles?: SeedFilesOptions,
		testRunner: TestRunnerName = DEFAULT_TEST_RUNNER,
	) {
		this.adapter = createTestRunnerAdapter(testRunner, { configFile: config });
		this.chromeBin = bin;
		this.customSettings = customSettings;
		this.codeVersion = codeVersion;
		this.cleanup = cleanup;
		this.releaseType = releaseType;
		this.customPageObjects = customPageObjects;
		this.locale = locale;
		this.seedFiles = seedFiles;
	}

	/**
	 * Start VS Code and run the tests with the selected test runner
	 * @param testFilesPattern glob pattern of test files to run
	 * @param logLevel The logging level for the Webdriver
	 * @return The exit code of the test run
	 */
	async runTests(testFilesPattern: string[], code: CodeUtil, resources: string[], logLevel: logging.Level = logging.Level.INFO): Promise<number> {
		const testFiles = [...expandTestFiles(testFilesPattern)];
		// test files loaded by another process (e.g. Vitest workers) are compiled there; custom locators always load here
		const unregister = registerTypeScript(withLocators(this.adapter.loadsTestFilesInProcess ? testFiles : [], this.customPageObjects));
		try {
			const self = this;
			const browser: VSBrowser = new VSBrowser(
				this.codeVersion,
				this.releaseType,
				this.customSettings,
				logLevel,
				this.customPageObjects,
				this.locale,
				this.seedFiles,
			);
			let coverage: Coverage | undefined;

			const setupWorkbench = this.withTimeout(
				async () => {
					if (code.coverageEnabled) {
						coverage = new Coverage();
						await coverage.loadConfig();
						process.env.NODE_V8_COVERAGE = coverage?.targetDir;
					}

					const start = Date.now();
					const binPath = process.platform === 'darwin' ? await self.createShortcut(code.getCodeFolder(), self.tmpLink) : self.chromeBin;

					// resources are passed to the launch itself: opening them with a
					// second-instance CLI call during startup triggers webview resource
					// corruption on VS Code >= 1.123.0 (microsoft/vscode#330243, #2454)
					await browser.start(binPath, resources);
					await browser.waitForWorkbench();

					console.log(`Browser ready in ${Date.now() - start} ms`);
					console.log('Launching tests...');
				},
				180000,
				'Workbench setup timed out after 180 seconds',
			);

			const teardownWorkbench = this.withTimeout(
				async () => {
					try {
						await browser.quit();
					} catch (err) {
						console.error('Error shutting down browser:', err);
					}

					if (process.platform === 'darwin') {
						try {
							if (await fs.pathExists(self.tmpLink)) {
								fs.unlinkSync(self.tmpLink);
							}
						} catch (err) {
							console.error('Error removing macOS symlink:', err);
						}
					}

					if (code.coverageEnabled) {
						try {
							await coverage?.write();
						} catch (err) {
							console.error('Error writing coverage data:', err);
						}
					}

					try {
						code.uninstallExtension(self.cleanup);
					} catch (err) {
						console.error('Error uninstalling extension:', err);
					}
				},
				180000,
				'Workbench teardown timed out after 180 seconds',
			);

			process.exitCode = await this.adapter.run({ testFiles, browser, workbench: { setup: setupWorkbench, teardown: teardownWorkbench } });
			if (process.exitCode) {
				console.log('\x1b[33m%s\x1b[0m', `${screenshotsReport(browser.getScreenshotsDir())}\n`);
			}
			return process.exitCode;
		} finally {
			unregister?.();
		}
	}

	private async createShortcut(src: string, dest: string): Promise<string> {
		try {
			await fs.ensureSymlink(src, dest, 'dir');
		} catch (err) {
			return this.chromeBin;
		}

		const dir = path.parse(src);
		const segments = this.chromeBin.split(path.sep);
		const newSegments = dest.split(path.sep);

		let found = false;
		for (const segment of segments) {
			if (!found) {
				found = segment === dir.base;
			} else {
				newSegments.push(segment);
			}
		}
		return path.join(dir.root, ...newSegments);
	}

	private withTimeout(fn: () => Promise<void>, ms: number, message: string): () => Promise<void> {
		return async () => {
			let timeout: NodeJS.Timeout | undefined;

			// Keep this promise before calling fn to ensure the timeout is set up,
			// as fn might be entirely synchronous even though it returns a Promise.
			const timerPromise = new Promise<never>((_, reject) => {
				timeout = setTimeout(() => reject(new Error(message)), ms);
			});

			try {
				await Promise.race([fn(), timerPromise]);
			} finally {
				clearTimeout(timeout);
			}
		};
	}
}
