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

import { VSBrowser } from '../browser';
import * as fs from 'fs-extra';
import Mocha from 'mocha';
import { globSync } from 'glob';
import { CodeUtil, CustomPageObjectsOptions, ReleaseQuality } from '../util/codeUtil';
import * as path from 'node:path';
import * as yaml from 'js-yaml';
import sanitize from 'sanitize-filename';
import { logging } from 'selenium-webdriver';
import * as os from 'node:os';
import { Coverage } from '../util/coverage';

/**
 * Mocha runner wrapper
 */
export class VSRunner {
	private readonly mocha: Mocha;
	private readonly chromeBin: string;
	private readonly customSettings: object;
	private readonly codeVersion: string;
	private readonly cleanup: boolean;
	private readonly releaseType: ReleaseQuality;
	private readonly customPageObjects?: CustomPageObjectsOptions;
	private readonly locale: string | undefined;
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
	) {
		const conf = this.loadConfig(config);
		this.mocha = new Mocha(conf);
		this.chromeBin = bin;
		this.customSettings = customSettings;
		this.codeVersion = codeVersion;
		this.cleanup = cleanup;
		this.releaseType = releaseType;
		this.customPageObjects = customPageObjects;
		this.locale = locale;
	}

	/**
	 * Set up mocha suite, add vscode instance handling, run tests
	 * @param testFilesPattern glob pattern of test files to run
	 * @param logLevel The logging level for the Webdriver
	 * @return The exit code of the mocha process
	 */
	runTests(testFilesPattern: string[], code: CodeUtil, resources: string[], logLevel: logging.Level = logging.Level.INFO): Promise<number> {
		return new Promise((resolve, reject) => {
			const self = this;
			const browser: VSBrowser = new VSBrowser(this.codeVersion, this.releaseType, this.customSettings, logLevel, this.customPageObjects, this.locale);
			let coverage: Coverage | undefined;

			const testFiles = new Set<string>();
			for (const pattern of testFilesPattern) {
				const universalPattern = pattern.replace(/'/g, '');
				globSync(universalPattern)
					.reverse()
					.forEach((val) => testFiles.add(val));
			}

			testFiles.forEach((file) => this.mocha.addFile(file));

			this.mocha.suite.afterEach(async function () {
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

			this.mocha.suite.beforeAll(async function () {
				this.timeout(180000);
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
			});

			this.mocha.suite.afterAll(async function () {
				this.timeout(180000);

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
			});

			try {
				this.mocha.run((failures) => {
					process.exitCode = failures ? 1 : 0;
					if (process.exitCode) {
						console.log('\x1b[33m%s\x1b[0m', `INFO: Screenshots of failures can be found in: ${browser.getScreenshotsDir()}\n`);
					}
					resolve(process.exitCode);
				});
			} catch (err) {
				reject(err);
			}
		});
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
					conf = yaml.load(fs.readFileSync(file, 'utf-8')) as Mocha.MochaOptions;
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
}
