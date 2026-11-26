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
import * as yaml from 'js-yaml';
import Mocha from 'mocha';
import * as os from 'node:os';
import * as path from 'node:path';
import sanitize from 'sanitize-filename';
import { logging } from 'selenium-webdriver';
import { VSBrowser } from '../browser';
import { CodeUtil, CustomPageObjectsOptions, ReleaseQuality, SeedFilesOptions } from '../util/codeUtil';
import { Coverage } from '../util/coverage';
import { registerTypeScript } from '../util/typescript';
import { takeScreenshotsOfFailedHooks } from './hookScreenshots';

// For some reason these properties are not yet included in @types/mocha,
// so we need to augment the MochaOptions interface ourselves.
declare module 'mocha' {
	interface MochaOptions {
		// https://legacy.mochajs.org/api/mocha#enableGlobalSetup
		enableGlobalSetup?: boolean;
		// https://legacy.mochajs.org/api/mocha#enableGlobalTeardown
		enableGlobalTeardown?: boolean;
		// https://legacy.mochajs.org/api/mocha#globalSetup
		globalSetup?: unknown;
		// https://legacy.mochajs.org/api/mocha#globalTeardown
		globalTeardown?: unknown;
	}
}

/** YAML 1.2 core schema plus merge keys, matching how mocha parses .mocharc.yml */
const MOCHARC_YAML_SCHEMA = yaml.CORE_SCHEMA.withTags(yaml.mergeTag);

/**
 * Expand test file glob patterns into the ordered set of files Mocha will load
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

/** A Mocha global setup or teardown fixture */
export type GlobalFixture = (this: object) => unknown;

/** Callbacks starting and stopping the VS Code workbench around the test run */
export interface WorkbenchLifecycle {
	setup: () => Promise<void>;
	teardown: () => Promise<void>;
}

/** Outcome of the global fixtures, filled in while Mocha runs them */
export interface GlobalFixturesState {
	/** whether starting the workbench or a user-provided global setup fixture failed */
	setupFailed: boolean;
	/** error thrown while starting the workbench or by a user-provided global setup fixture */
	setupError?: unknown;
	/** whether a user-provided global teardown fixture or the workbench shutdown failed */
	teardownFailed: boolean;
}

/**
 * Wrap the workbench lifecycle and the user-provided global fixtures into a single Mocha global
 * setup fixture and a single global teardown fixture.
 *
 * Mocha does not catch errors thrown by global fixtures on every supported version, and it stops
 * at the first failing one, so:
 * - errors from the setup are stored and rethrown from a root `before all` hook, failing the tests
 *   the same way a failed root hook would, while the teardown still runs
 * - each user-provided teardown fixture is isolated, and the workbench is always shut down last
 *
 * User-provided fixtures are skipped when disabled with `enableGlobalSetup` / `enableGlobalTeardown`,
 * the workbench fixtures always run.
 * @param mocha Mocha instance, with the user configuration already applied
 * @param workbench callbacks starting and stopping the workbench
 * @returns state of the fixtures, read once the run finishes
 */
export function installGlobalFixtures(mocha: Mocha, workbench: WorkbenchLifecycle): GlobalFixturesState {
	const state: GlobalFixturesState = { setupFailed: false, teardownFailed: false };
	const userSetupFixtures = userFixtures(mocha.options.globalSetup, mocha.options.enableGlobalSetup);
	const userTeardownFixtures = userFixtures(mocha.options.globalTeardown, mocha.options.enableGlobalTeardown);

	// the workbench starts before any user-provided fixture runs
	mocha.globalSetup(async function (this: object) {
		try {
			await workbench.setup();
			await runInSequence(userSetupFixtures, this);
		} catch (err) {
			state.setupFailed = true;
			state.setupError = err;
		}
	});

	// report a failed setup as a root hook failure, so that the tests fail and the teardown still runs
	mocha.suite.beforeAll('ExTester global setup', function () {
		if (state.setupFailed) {
			throw state.setupError;
		}
	});

	// user-provided fixtures can still interact with the workbench, which is shut down last
	mocha.globalTeardown(async function (this: object) {
		try {
			await runInSequence(userTeardownFixtures, this, (err) => {
				console.error('Error in global teardown fixture:', err);
				state.teardownFailed = true;
			});
		} finally {
			try {
				await workbench.teardown();
			} catch (err) {
				console.error('Error shutting down the workbench:', err);
				state.teardownFailed = true;
			}
		}
	});

	mocha.enableGlobalSetup(true);
	mocha.enableGlobalTeardown(true);
	return state;
}

/**
 * Compute the exit code of a test run
 * @param failures number of failures reported by Mocha
 * @param state outcome of the global fixtures
 * @returns 1 if a test, a hook or a global fixture failed, 0 otherwise
 */
export function exitCode(failures: number, state: GlobalFixturesState): number {
	return failures > 0 || state.setupFailed || state.teardownFailed ? 1 : 0;
}

/**
 * Run fixtures one after another, each one starting once the previous one has settled
 * @param fixtures fixtures to run
 * @param context `this` of every fixture, shared between the setup and the teardown
 * @param onError called with the error of a failing fixture, the remaining ones still run;
 * without it, the first error stops the sequence and is rethrown
 */
function runInSequence(fixtures: GlobalFixture[], context: object, onError?: (err: unknown) => void): Promise<void> {
	return fixtures.reduce<Promise<void>>(async (previous, fixture) => {
		await previous;
		try {
			await fixture.call(context);
		} catch (err) {
			if (!onError) {
				throw err;
			}
			onError(err);
		}
	}, Promise.resolve());
}

function userFixtures(fixtures: unknown, enabled: boolean | undefined): GlobalFixture[] {
	if (enabled === false || !fixtures) {
		return [];
	}
	return (Array.isArray(fixtures) ? fixtures : [fixtures]) as GlobalFixture[];
}

/**
 * Mocha runner wrapper
 */
export class VSRunner {
	private readonly mochaOptions: Mocha.MochaOptions;
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
	) {
		this.mochaOptions = this.loadConfig(config);
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
	 * Set up mocha suite, add vscode instance handling, run tests
	 * @param testFilesPattern glob pattern of test files to run
	 * @param logLevel The logging level for the Webdriver
	 * @return The exit code of the mocha process
	 */
	runTests(testFilesPattern: string[], code: CodeUtil, resources: string[], logLevel: logging.Level = logging.Level.INFO): Promise<number> {
		let unregister: (() => void) | undefined;
		return new Promise<number>((resolve) => {
			const testFiles = expandTestFiles(testFilesPattern);
			unregister = registerTypeScript(withLocators(testFiles, this.customPageObjects));

			const self = this;
			const mocha = new Mocha(this.mochaOptions);
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

			testFiles.forEach((file) => mocha.addFile(file));

			mocha.suite.afterEach(async function () {
				// Screenshot only genuinely failed tests — 'pending' (skipped) tests
				// would otherwise produce misleading failure screenshots in CI artifacts.
				if (this.currentTest?.state === 'failed') {
					try {
						const filename = sanitize(this.currentTest.fullTitle());
						await browser.takeScreenshot(filename);
					} catch (err) {
						console.log('Screenshot capture failed.', err);
					}
				}
			});

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

			const fixtures = installGlobalFixtures(mocha, { setup: setupWorkbench, teardown: teardownWorkbench });
			// Every hook of the test files, loaded by mocha.run, takes a screenshot when it fails; the hooks above do not.
			takeScreenshotsOfFailedHooks(mocha.suite);

			// Finally run tests
			mocha.run((failures) => {
				if (fixtures.setupFailed && failures === 0) {
					// no test ran, so the root hook never reported the error
					console.error('Error in global setup:', fixtures.setupError);
				}
				process.exitCode = exitCode(failures, fixtures);
				if (process.exitCode) {
					console.log('\x1b[33m%s\x1b[0m', `${screenshotsReport(browser.getScreenshotsDir())}\n`);
				}
				resolve(process.exitCode);
			});
		}).finally(() => unregister?.());
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

	private loadConfig(config?: string): Mocha.MochaOptions {
		const defaultFiles = ['.mocharc.js', '.mocharc.json', '.mocharc.yml', '.mocharc.yaml'];
		let conf: Mocha.MochaOptions = {};
		const isExplicit = !!config;
		let file = config;
		if (!config) {
			file = path.resolve('.');
			for (const defFile of defaultFiles) {
				if (fs.existsSync(path.join(file, defFile))) {
					file = path.join(file, defFile);
					break;
				}
			}
		}

		if (file && fs.existsSync(file) && fs.statSync(file).isFile()) {
			console.log(`Loading mocha configuration from ${file}`);
			if (/\.(yml|yaml)$/.test(file)) {
				try {
					// js-yaml 5 throws on an empty stream and its default (YAML 1.2 core) schema no longer applies merge
					// keys (`<<`). Keep the js-yaml 4 behaviour mocha itself still has: merge keys are honoured, and an
					// empty or comment-only file means "no options".
					const docs = yaml.loadAll(fs.readFileSync(file, 'utf-8'), { schema: MOCHARC_YAML_SCHEMA });
					if (docs.length > 1) {
						throw new Error('expected a single YAML document');
					}
					conf = (docs[0] as Mocha.MochaOptions | null | undefined) ?? {};
				} catch (err) {
					if (isExplicit) {
						throw new Error(`Failed to parse mocha configuration ${file}: ${err}`);
					}
					console.log(`Invalid mocha configuration file ${file}, will be ignored:`, err);
				}
			} else if (/\.(js|json)$/.test(file)) {
				try {
					conf = require(path.resolve(file));
				} catch (err) {
					if (isExplicit) {
						throw new Error(`Failed to load mocha configuration ${file}: ${err}`);
					}
					console.log(`Invalid mocha configuration file ${file}, will be ignored:`, err);
				}
			} else {
				const msg = `Unsupported mocha configuration file extension: ${file}. Use .js, .json, .yml or .yaml.`;
				if (isExplicit) {
					throw new Error(msg);
				}
				console.log(msg);
			}
		}

		if (process.env.MOCHA_GREP) {
			conf.grep = process.env.MOCHA_GREP;
		}
		if (process.env.MOCHA_INVERT) {
			conf.invert = process.env.MOCHA_INVERT === 'true';
		}

		return conf;
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
