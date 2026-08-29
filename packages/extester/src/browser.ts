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
import * as fs from 'fs-extra';
import { satisfies } from 'compare-versions';
import { WebDriver, Builder, initPageObjects, logging, By, Browser, EditorView, Workbench } from '@redhat-developer/page-objects';
import { Options, ServiceBuilder } from 'selenium-webdriver/chrome';
import { getLocatorsPath } from '@redhat-developer/locators';
import { CodeUtil, CustomPageObjectsOptions, ReleaseQuality } from './util/codeUtil';
import { DEFAULT_STORAGE_FOLDER } from './extester';
import { DriverUtil } from './util/driverUtil';

export class VSBrowser {
	static readonly baseVersion = '1.37.0';
	static readonly browserName = 'vscode';
	private readonly storagePath: string;
	private readonly extensionsFolder: string | undefined;
	private readonly customSettings: object;
	private _driver!: WebDriver;
	private readonly codeVersion: string;
	private readonly releaseType: ReleaseQuality;
	private readonly logLevel: logging.Level;
	private readonly customPageObjects?: CustomPageObjectsOptions;
	private readonly locale: string;
	private static _instance: VSBrowser;
	private readonly _startTimestamp: string;
	private static _signalHandlersRegistered = false;

	private formatTimestamp(date: Date): string {
		const pad = (num: number) => num.toString().padStart(2, '0');
		return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
	}

	constructor(
		codeVersion: string,
		releaseType: ReleaseQuality,
		customSettings: object = {},
		logLevel: logging.Level = logging.Level.INFO,
		customPageObjects?: CustomPageObjectsOptions,
		locale: string = '',
	) {
		this.storagePath = process.env.TEST_RESOURCES ? process.env.TEST_RESOURCES : path.resolve(DEFAULT_STORAGE_FOLDER);
		this.extensionsFolder = process.env.EXTENSIONS_FOLDER ? process.env.EXTENSIONS_FOLDER : undefined;
		this.customSettings = customSettings;
		this.codeVersion = codeVersion;
		this.releaseType = releaseType;
		this.logLevel = logLevel;
		this.customPageObjects = customPageObjects;
		this.locale = locale;
		this._startTimestamp = this.formatTimestamp(new Date());

		VSBrowser._instance = this;
	}

	/**
	 * Starts the vscode browser from a given path
	 * @param codePath path to code binary
	 */
	async start(codePath: string, resources: string[] = []): Promise<VSBrowser> {
		const settingsDir = path.join(this.storagePath, 'settings');
		const userSettings = path.join(settingsDir, 'User');
		const languagePacksPath = path.join(settingsDir, 'languagepacks.json');

		// Preserve languagepacks.json across the settings wipe.
		// It is written by the VS Code CLI install step (installExt) with --user-data-dir
		// pointing to settingsDir, so it is always in the right location.
		// It contains absolute translation file paths that VS Code requires to load
		// the language pack — we must not regenerate it ourselves.
		let languagePacks: object | undefined;
		if (fs.existsSync(languagePacksPath)) {
			try {
				languagePacks = fs.readJSONSync(languagePacksPath);
			} catch {
				// ignore malformed file; VS Code will fall back to English
			}
		}

		if (fs.existsSync(userSettings)) {
			try {
				fs.removeSync(settingsDir);
			} catch (e: unknown) {
				const code = (e as NodeJS.ErrnoException).code;
				if (code === 'EBUSY' || code === 'EPERM') {
					console.warn(`Could not fully clean settings dir (${code}), continuing anyway.`);
				} else {
					throw e;
				}
			}
		}

		let defaultSettings = {
			// Never let the tested VS Code instance update itself mid-run: on macOS
			// the background updater replaces application files while tests execute,
			// which manifests as "Your Code installation appears to be corrupt" and a
			// dead extension host ("version mismatch") partway through a session.
			'update.mode': 'none',
			'update.showReleaseNotes': false,
			'extensions.autoUpdate': false,
			'extensions.autoCheckUpdates': false,
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
			'workbench.secondarySideBar.defaultVisibility': 'hidden',
			'workbench.welcomePage.experimentalOnboarding': false,
			'workbench.welcomePage.walkthroughs.openOnInstall': false,
			'workbench.editor.useModal': 'off',
			// Disable workbench animations: VS Code >=1.133 fades the quick input
			// out over 0.15s on close, so an isDisplayed() check right after
			// accepting a pick still sees the widget. Whether motion is on depends
			// on the OS reduced-motion preference (GitHub windows/macos runners
			// report it, Xvfb linux does not), making runs environment-dependent.
			'workbench.reduceMotion': 'on',
			...(satisfies(this.codeVersion, '>=1.101.0') ? { 'window.menuStyle': 'custom' } : {}),
		};
		if (Object.keys(this.customSettings).length > 0) {
			console.log('Detected user defined code settings');
			defaultSettings = { ...defaultSettings, ...this.customSettings };
		}

		fs.mkdirpSync(path.join(userSettings, 'globalStorage'));
		fs.writeJSONSync(path.join(userSettings, 'settings.json'), defaultSettings);
		console.log(`Writing code settings to ${path.join(userSettings, 'settings.json')}`);

		if (this.locale) {
			fs.writeJSONSync(path.join(userSettings, 'locale.json'), { locale: this.locale, osLocale: this.locale });
			console.log(`Writing locale settings to ${path.join(userSettings, 'locale.json')}`);
		}

		if (languagePacks && Object.keys(languagePacks).length > 0) {
			fs.writeJSONSync(languagePacksPath, languagePacks);
			console.log(`Restored languagepacks.json to ${languagePacksPath}`);
		}

		const args = ['--no-sandbox', '--disable-dev-shm-usage', `--user-data-dir=${path.join(this.storagePath, 'settings')}`];

		if (this.locale) {
			args.push(`--locale=${this.locale}`);
		}

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

		// Open initial resources with the launch itself instead of a post-launch
		// second-instance CLI call: when such a call lands while VS Code is still
		// starting up, VS Code >= 1.123.0 corrupts webview resource streaming for
		// the whole window (microsoft/vscode#330243, #2454).
		for (const resource of resources) {
			args.push(VSBrowser.resourceToLaunchArg(resource));
		}

		const extraArgs = ['--skip-welcome', '--skip-sessions-welcome', '--skip-release-notes'];
		const options = new Options()
			.setChromeBinaryPath(codePath)
			.addArguments(...args, ...extraArgs)
			.windowTypes('webview') as Options;

		const prefs = new logging.Preferences();
		prefs.setLevel(logging.Type.DRIVER, DriverUtil.resolveLogLevel(this.logLevel));
		options.setLoggingPrefs(prefs);

		const chromeDriverBinaryPath = DriverUtil.findChromeDriverBinary(this.storagePath);

		const chromeDriverLog = path.join(this.storagePath, 'chromedriver.log');
		console.log(`Launching browser... (ChromeDriver log: ${chromeDriverLog})`);

		this._driver = await new Builder()
			.setChromeService(
				new ServiceBuilder(chromeDriverBinaryPath).loggingTo(chromeDriverLog).addArguments(...DriverUtil.chromeDriverLogLevelArgs(this.logLevel)),
			)
			.forBrowser(Browser.CHROME)
			.setChromeOptions(options)
			.build();

		await this._driver.manage().setTimeouts({
			implicit: 0,
			pageLoad: 60_000,
			script: 30_000,
		});

		VSBrowser._instance = this;

		initPageObjects(this.codeVersion, VSBrowser.baseVersion, getLocatorsPath(), this._driver, VSBrowser.browserName, this.customPageObjects?.locatorsPath);
		VSBrowser.registerSignalHandlers();
		return this;
	}

	/**
	 * Register process signal handlers to ensure the WebDriver session is
	 * terminated when the process exits unexpectedly (Ctrl+C, kill, crash).
	 * Prevents orphaned ChromeDriver and VS Code processes on CI.
	 */
	private static registerSignalHandlers(): void {
		if (VSBrowser._signalHandlersRegistered) {
			return;
		}
		VSBrowser._signalHandlersRegistered = true;

		const emergencyShutdown = async (reason: string, exitCode: number) => {
			console.error(`Emergency browser shutdown triggered by ${reason}`);
			try {
				if (VSBrowser._instance?._driver) {
					// Bound the quit call — if ChromeDriver is unresponsive (likely when the
					// process is being killed), waiting on it forever would defeat the purpose
					// of this handler and stall the CI runner's shutdown.
					await Promise.race([VSBrowser._instance._driver.quit(), new Promise((res) => setTimeout(res, 5_000))]);
				}
			} catch {
				// best-effort; process is already dying
			}
			process.exit(exitCode);
		};

		// NOTE: deliberately no 'uncaughtException' handler here — Mocha installs its own
		// to fail the current test and continue the run; exiting the process from a second
		// handler would abort the whole suite on any stray async error.
		process.on('SIGINT', () => void emergencyShutdown('SIGINT', 130));
		process.on('SIGTERM', () => void emergencyShutdown('SIGTERM', 143));
	}

	/**
	 * Convert a filesystem path into the VS Code CLI argument that opens it with
	 * the initial launch: `--folder-uri` for directories, `--file-uri` for files.
	 * @param resource path to a file or folder
	 * @returns the launch argument string
	 */
	static resourceToLaunchArg(resource: string): string {
		const isDirectory = fs.existsSync(resource) && fs.statSync(resource).isDirectory();
		return `${isDirectory ? '--folder-uri' : '--file-uri'}=${pathToFileURL(path.resolve(resource)).href}`;
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
		// Errors that indicate the workbench is not (or no longer) present rather than a
		// broken session: the window may be mid-reload (e.g. a folder was just opened,
		// which reloads the whole workbench), so keep polling instead of failing.
		const transientErrors = new Set(['NoSuchElementError', 'StaleElementReferenceError', 'WebDriverError', 'NoSuchWindowError']);
		// Require the workbench to stay present across two checks ~500ms apart:
		// right before a window reload the OLD document is still visible for an
		// instant, and returning at that moment hands callers elements that die
		// immediately after.
		let presentSince = 0;
		await this._driver.wait(
			async () => {
				try {
					const workbench = await this._driver.findElements(By.className('monaco-workbench'));
					const present = workbench.length > 0 && (await workbench[0].isDisplayed());
					if (!present) {
						presentSince = 0;
						return false;
					}
					if (presentSince === 0) {
						presentSince = Date.now();
						return false;
					}
					return Date.now() - presentSince >= 500;
				} catch (err) {
					presentSince = 0;
					const name = (err as Error).name;
					if (name === 'NoSuchWindowError') {
						// The window handle died (e.g. replaced during a reload) — re-attach
						// to the first available window and keep polling.
						const handles = await this._driver.getAllWindowHandles().catch(() => [] as string[]);
						if (handles.length > 0) {
							await this._driver.switchTo().window(handles[0]);
						}
						return false;
					}
					if (transientErrors.has(name)) {
						return false;
					}
					throw err;
				}
			},
			timeout,
			`Workbench was not loaded properly after ${timeout} ms.`,
		);

		if (waitForFn) {
			await waitForFn();
		}
	}

	/**
	 * Terminates the webdriver/browser
	 */
	async quit(): Promise<void> {
		try {
			const entries = await this._driver.manage().logs().get(logging.Type.DRIVER);
			const logFile = path.join(this.storagePath, 'test.log');
			const logStream = fs.createWriteStream(logFile, { flags: 'w' });
			for (const entry of entries) {
				logStream.write(`[${new Date(entry.timestamp).toLocaleTimeString()}][${entry.level.name}] ${entry.message}`);
			}
			logStream.end();
		} catch (err) {
			console.error('Failed to collect driver logs before shutdown:', err);
		} finally {
			console.log('Shutting down the browser');
			try {
				await this._driver.quit();
			} catch (quitErr) {
				console.error('Error while quitting the driver:', quitErr);
			}
		}
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

		// The CLI open request can occasionally get lost by the running VS Code instance
		// (observed on macOS after a workspace switch reloaded the window). Verify that
		// each file resource actually shows up as an editor tab and retry the open once
		// before giving up, so callers fail fast with a clear error instead of timing
		// out later on a missing editor.
		const files = paths.filter((p) => fs.existsSync(p) && fs.statSync(p).isFile());
		if (files.length > 0 && !(await this.filesOpenedInEditor(files, 15_000))) {
			console.warn(`Opened resources did not appear in the editor, retrying: ${files.join(', ')}`);
			code.open(...paths);
			await this.waitForWorkbench();
			if (!(await this.filesOpenedInEditor(files, 10_000))) {
				// The running instance can drop CLI open requests entirely mid-session
				// (observed repeatedly on macOS). Fall back to opening each file through
				// the workbench quick open box, which does not depend on the CLI channel.
				console.warn(`CLI open request was dropped, opening file(s) via quick open: ${files.join(', ')}`);
				for (const file of files) {
					const input = await new Workbench().openCommandPrompt();
					await input.setText(file);
					await input.confirm();
				}
				if (!(await this.filesOpenedInEditor(files, 10_000))) {
					throw new Error(`Failed to open resource(s) in the editor: ${files.join(', ')}`);
				}
			}
		}
	}

	/**
	 * Best-effort check that every given file is open as an editor tab.
	 * Resolves to true once all file basenames are found among the open editor titles
	 * in any editor group, false if that does not happen within the given timeout.
	 */
	private async filesOpenedInEditor(files: string[], timeout: number): Promise<boolean> {
		const names = files.map((f) => path.basename(f));
		try {
			await this._driver.wait(async () => {
				try {
					const titles = await new EditorView().getOpenEditorTitles();
					return names.every((name) => titles.some((title) => title === name || title.startsWith(name)));
				} catch {
					// Editor area may not exist yet (empty window) or may be mid-reload
					return false;
				}
			}, timeout);
			return true;
		} catch {
			return false;
		}
	}
}
