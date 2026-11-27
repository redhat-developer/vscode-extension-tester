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
import * as yaml from 'js-yaml';
import Mocha from 'mocha';
import * as path from 'node:path';
import sanitize from 'sanitize-filename';
import { exitCode, GlobalFixturesState, RunContext, TestRunnerAdapter, TestRunnerOptions, WorkbenchLifecycle } from '../adapter';

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

/** A Mocha global setup or teardown fixture */
export type GlobalFixture = (this: object) => unknown;

/**
 * Runs the tests with Mocha, in the ExTester process. The workbench starts in a Mocha
 * global setup fixture and stops in a global teardown fixture, around the user-provided ones.
 */
export class MochaAdapter implements TestRunnerAdapter {
	readonly name = 'mocha';
	readonly loadsTestFilesInProcess = true;
	private readonly mochaOptions: Mocha.MochaOptions;

	constructor(options: TestRunnerOptions = {}) {
		this.mochaOptions = loadMochaConfig(options.configFile);
	}

	run({ testFiles, browser, workbench }: RunContext): Promise<number> {
		return new Promise<number>((resolve) => {
			const mocha = new Mocha(this.mochaOptions);
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

			const fixtures = installGlobalFixtures(mocha, workbench);

			mocha.run((failures) => {
				if (fixtures.setupFailed && failures === 0) {
					// no test ran, so the root hook never reported the error
					console.error('Error in global setup:', fixtures.setupError);
				}
				resolve(exitCode(failures, fixtures));
			});
		});
	}
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
 * Load the Mocha configuration: the given file, or the first `.mocharc.*` found in the working directory.
 * `MOCHA_GREP` and `MOCHA_INVERT` override the file's `grep` and `invert`.
 * @param config explicit configuration file; an explicit file that cannot be loaded is an error,
 * a default one that cannot be loaded is reported and ignored
 */
export function loadMochaConfig(config?: string): Mocha.MochaOptions {
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
