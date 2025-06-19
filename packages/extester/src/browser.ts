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

import * as path from 'path';
import * as fs from 'fs-extra';
import { satisfies } from 'compare-versions';
import { WebDriver, Builder, until, initPageObjects, logging, By, Browser } from '@redhat-developer/page-objects';
import { Options, ServiceBuilder } from 'selenium-webdriver/chrome';
import { getLocatorsPath } from '@redhat-developer/locators';
import { CodeUtil, ReleaseQuality } from './util/codeUtil';
import { DEFAULT_STORAGE_FOLDER } from './extester';
import { DriverUtil } from './util/driverUtil';

export class VSBrowser {
	static readonly baseVersion = '1.37.0';
	static readonly browserName = 'vscode';
	private storagePath: string;
	private extensionsFolder: string | undefined;
	private customSettings: object;
	private _driver!: WebDriver;
	private codeVersion: string;
	private releaseType: ReleaseQuality;
	private logLevel: logging.Level;
	private static _instance: VSBrowser;
	private readonly _startTimestamp: string;

	private formatTimestamp(date: Date): string {
		const pad = (num: number) => num.toString().padStart(2, '0');
		return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
	}

	constructor(codeVersion: string, releaseType: ReleaseQuality, customSettings: object = {}, logLevel: logging.Level = logging.Level.INFO) {
		this.storagePath = process.env.TEST_RESOURCES ? process.env.TEST_RESOURCES : path.resolve(DEFAULT_STORAGE_FOLDER);
		this.extensionsFolder = process.env.EXTENSIONS_FOLDER ? process.env.EXTENSIONS_FOLDER : undefined;
		this.customSettings = customSettings;
		this.codeVersion = codeVersion;
		this.releaseType = releaseType;
		this.logLevel = logLevel;
		this._startTimestamp = this.formatTimestamp(new Date());

		VSBrowser._instance = this;
	}

	/**
	 * Starts the vscode browser from a given path
	 * @param codePath path to code binary
	 */
	async start(codePath: string): Promise<VSBrowser> {
		const userSettings = path.join(this.storagePath, 'settings', 'User');
		if (fs.existsSync(userSettings)) {
			fs.removeSync(path.join(this.storagePath, 'settings'));
		}

		let defaultSettings = {
			'workbench.editor.enablePreview': false,
			'workbench.startupEditor': 'none',
			'window.titleBarStyle': 'custom',
			'window.commandCenter': false,
			'window.dialogStyle': 'custom',
			'window.restoreFullscreen': true,
			'window.newWindowDimensions': 'maximized',
			'security.workspace.trust.enabled': false,
			'files.simpleDialog.enable': true,
			'terminal.integrated.copyOnSelection': true,
			...(satisfies(this.codeVersion, '>=1.101.0') ? { 'window.menuStyle': 'custom' } : {}),
		};
		if (Object.keys(this.customSettings).length > 0) {
			console.log('Detected user defined code settings');
			defaultSettings = { ...defaultSettings, ...this.customSettings };
		}

		fs.mkdirpSync(path.join(userSettings, 'globalStorage'));
		fs.writeJSONSync(path.join(userSettings, 'settings.json'), defaultSettings);
		console.log(`Writing code settings to ${path.join(userSettings, 'settings.json')}`);

		const args = ['--no-sandbox', '--disable-dev-shm-usage', `--user-data-dir=${path.join(this.storagePath, 'settings')}`];

		if (this.extensionsFolder) {
			args.push(`--extensions-dir=${this.extensionsFolder}`);
		}

		if (satisfies(this.codeVersion, '<1.39.0')) {
			if (process.platform === 'win32') {
				fs.copyFileSync(path.resolve(__dirname, '..', '..', 'resources', 'state.vscdb'), path.join(userSettings, 'globalStorage', 'state.vscdb'));
			}
			args.push(`--extensionDevelopmentPath=${process.cwd()}`);
		} else if (process.env.EXTENSION_DEV_PATH) {
			args.push(`--extensionDevelopmentPath=${process.env.EXTENSION_DEV_PATH}`);
		}

		let options = new Options().setChromeBinaryPath(codePath).addArguments(...args) as any;
		options['options_'].windowTypes = ['webview'];
		options = options as Options;

		const prefs = new logging.Preferences();
		prefs.setLevel(logging.Type.DRIVER, this.logLevel);
		options.setLoggingPrefs(prefs);

		const driverBinary = process.platform === 'win32' ? 'chromedriver.exe' : 'chromedriver';
		let chromeDriverBinaryPath = path.join(this.storagePath, driverBinary);
		if (satisfies(this.codeVersion, '>=1.86.0')) {
			chromeDriverBinaryPath = path.join(this.storagePath, `chromedriver-${DriverUtil.getChromeDriverPlatform()}`, driverBinary);
		}

		console.log('Launching browser...');
		this._driver = await new Builder()
			.setChromeService(new ServiceBuilder(chromeDriverBinaryPath))
			.forBrowser(Browser.CHROME)
			.setChromeOptions(options)
			.build();
		VSBrowser._instance = this;

		initPageObjects(this.codeVersion, VSBrowser.baseVersion, getLocatorsPath(), this._driver, VSBrowser.browserName);
		return this;
	}

	/**
	 * Returns a reference to the underlying instance of Webdriver
	 */
	get driver(): WebDriver {
		return this._driver;
	}

	/**
	 * Returns the vscode version as string
	 */
	get version(): string {
		return this.codeVersion;
	}

	/**
	 * Returns an instance of VSBrowser
	 */
	static get instance(): VSBrowser {
		return VSBrowser._instance;
	}

	/**
	 * Waits for the VS Code workbench UI to be fully loaded and optionally performs
	 * an additional async or sync check after the workbench appears.
	 *
	 * This method waits for the presence of the `.monaco-workbench` element within the specified timeout.
	 * If a WebDriver error occurs (e.g. flaky startup), it retries after a short delay.
	 * Additionally, a follow-up function (`waitForFn`) can be passed to perform custom
	 * readiness checks (e.g. for UI elements, extensions, or custom content).
	 *
	 * @param timeout - Maximum time in milliseconds to wait for the workbench to appear (default: 30,000 ms).
	 * @param waitForFn - Optional function (sync or async) to be executed after the workbench is located.
	 *
	 * @throws If the workbench is not found in time and no recoverable WebDriver error occurred.
	 *
	 * @example
	 * // Wait for the workbench with default timeout
	 * await waitForWorkbench();
	 *
	 * @example
	 * // Wait for the workbench and ensure a custom UI element is present
	 * await waitForWorkbench(10000, async () => {
	 *   await driver.wait(until.elementLocated(By.id('my-element')), 5000);
	 * });
	 */
	async waitForWorkbench(timeout: number = 30_000, waitForFn?: () => void | Promise<any>): Promise<void> {
		// Workaround/patch for https://github.com/redhat-developer/vscode-extension-tester/issues/466
		try {
			await this._driver.wait(until.elementLocated(By.className('monaco-workbench')), timeout, `Workbench was not loaded properly after ${timeout} ms.`);
		} catch (err) {
			if ((err as Error).name === 'WebDriverError') {
				await new Promise((res) => setTimeout(res, 3_000));
			} else {
				throw err;
			}
		}
		if (waitForFn) {
			await waitForFn();
		}
	}

	/**
	 * Terminates the webdriver/browser
	 */
	async quit(): Promise<void> {
		const entries = await this._driver.manage().logs().get(logging.Type.DRIVER);
		const logFile = path.join(this.storagePath, 'test.log');
		const stream = fs.createWriteStream(logFile, { flags: 'w' });
		entries.forEach((entry) => {
			stream.write(`[${new Date(entry.timestamp).toLocaleTimeString()}][${entry.level.name}] ${entry.message}`);
		});
		stream.end();

		console.log('Shutting down the browser');
		await this._driver.quit();
	}

	/**
	 * Take a screenshot of the browser
	 * @param name file name of the screenshot without extension
	 */
	async takeScreenshot(name: string): Promise<void> {
		const data = await this._driver.takeScreenshot();
		const dir = path.join(this.storagePath, 'screenshots', this._startTimestamp);
		fs.mkdirpSync(dir);
		fs.writeFileSync(path.join(dir, `${name}.png`), data, 'base64');
	}

	/**
	 * Get a screenshots folder path
	 * @returns string path to the screenshots folder
	 */
	getScreenshotsDir(): string {
		return path.join(this.storagePath, 'screenshots', this._startTimestamp);
	}

	/**
	 * Opens one or more resources in the editor and optionally performs a follow-up action.
	 *
	 * This method accepts a variable number of arguments. All string arguments are interpreted
	 * as resource paths to be opened. Optionally, a single callback function (synchronous or asynchronous)
	 * can be provided as the last argument. This callback will be invoked after all resources have been opened.
	 *
	 * @param args - A list of file paths to open followed optionally by a callback function.
	 *               The callback can be either synchronous or asynchronous.
	 *
	 * @example
	 * // Open two files
	 * await openResources('file1.ts', 'file2.ts');
	 *
	 * @example
	 * // Open one file and then wait for a condition
	 * await openResources('file1.ts', async () => {
	 *   await waitForElementToLoad();
	 * });
	 */
	async openResources(...args: (string | (() => void | Promise<any>))[]): Promise<void> {
		const paths = args.filter((arg) => typeof arg === 'string');
		const waitForFn = args.find((arg) => typeof arg === 'function') as (() => void | Promise<any>) | undefined;

		if (paths.length === 0) {
			return;
		}

		const code = new CodeUtil(this.storagePath, this.releaseType, this.extensionsFolder);
		code.open(...paths);
		await this.waitForWorkbench(undefined, waitForFn);
	}
}
