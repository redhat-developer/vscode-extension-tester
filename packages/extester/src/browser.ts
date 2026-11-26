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
import { WebDriver, Builder, initPageObjects, logging, By, Browser, EditorTab, EditorView, Workbench } from '@redhat-developer/page-objects';
import { Options, ServiceBuilder } from 'selenium-webdriver/chrome';
import { getLocatorsPath } from '@redhat-developer/locators';
import {
	CodeUtil,
	CustomPageObjectsOptions,
	ReleaseQuality,
	SeedFilesOptions,
	findShadowedSettings,
	getDefaultSettings,
	seedKeybindingsFile,
	seedSnippetsDir,
	removeDirWithRetry,
	flagConflictWarnings,
	overriddenDefaultKeys,
	validateUserDataDirLength,
} from './util/codeUtil';
import { DEFAULT_STORAGE_FOLDER } from './extester';
import { DriverUtil } from './util/driverUtil';
import { browserLaunchEnvironment, formatLaunchFailure, isSessionNotCreated } from './util/launchDiagnostics';
import {
	HIDDEN_WINDOW_MIN_VERSION,
	adoptSession,
	OpenedResources,
	closeBidiConnection,
	filesToReopen,
	forwardToCurrentSession,
	hiddenWindowArgs,
	isHiddenWindowRequested,
	supportsHiddenWindow,
	trackOpened,
} from './util/hiddenWindow';

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
	private readonly seedFiles?: SeedFilesOptions;
	private static _instance: VSBrowser;
	private readonly _startTimestamp: string;
	private static _signalHandlersRegistered = false;
	private codePath: string | undefined;
	private readonly hiddenWindow: boolean;
	/** set after the first VS Code session ended, so later sessions append to the logs */
	private appendLogs = false;
	/** what the window has open, as far as ExTester opened it, so a hidden window reload can open it again */
	private opened: OpenedResources = { workspace: [], files: [] };

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
		seedFiles?: SeedFilesOptions,
	) {
		this.storagePath = process.env.TEST_RESOURCES ? process.env.TEST_RESOURCES : path.resolve(DEFAULT_STORAGE_FOLDER);
		this.extensionsFolder = process.env.EXTENSIONS_FOLDER ? process.env.EXTENSIONS_FOLDER : undefined;
		this.customSettings = customSettings;
		this.codeVersion = codeVersion;
		this.releaseType = releaseType;
		this.logLevel = logLevel;
		this.customPageObjects = customPageObjects;
		this.locale = locale;
		this.seedFiles = seedFiles;
		this._startTimestamp = this.formatTimestamp(new Date());
		// Known before start(): test files read `isHiddenWindow` when they load, which is
		// before the global setup launches VS Code.
		this.hiddenWindow = isHiddenWindowRequested() && supportsHiddenWindow(this.codeVersion);

		VSBrowser._instance = this;
	}

	/**
	 * Starts the vscode browser from a given path
	 * @param codePath path to code binary
	 */
	async start(codePath: string, resources: string[] = []): Promise<VSBrowser> {
		this.codePath = codePath;
		await this.prepareUserDataDir();
		if (isHiddenWindowRequested() && !this.hiddenWindow) {
			console.log(
				'\x1b[33m%s\x1b[0m',
				`WARNING: --hidden_window needs VS Code ${HIDDEN_WINDOW_MIN_VERSION} or newer, VS Code ${this.codeVersion} will show its window as usual`,
			);
		}
		this.warnShadowedSettings(resources);
		const browser = await this.launch(codePath, resources);
		this.opened = trackOpened(this.opened, resources, isFolderOrWorkspace);
		return browser;
	}

	/**
	 * Write a fresh user data dir: the framework's default settings merged with the custom ones,
	 * seeded keybindings and snippets, and the locale.
	 */
	private async prepareUserDataDir(): Promise<void> {
		const settingsDir = path.join(this.storagePath, 'settings');
		const userSettings = path.join(settingsDir, 'User');
		const languagePacksPath = path.join(settingsDir, 'languagepacks.json');

		// A too-long user data dir path makes VS Code die instantly on its IPC
		// socket bind, surfaced by ChromeDriver only as "Chrome instance exited" —
		// fail here with an actionable message instead.
		const pathLengthError = validateUserDataDirLength(settingsDir);
		if (pathLengthError) {
			throw new Error(pathLengthError);
		}

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
			// A busy dir gets one retry, then a hard failure: continuing with a
			// half-wiped settings dir means nondeterministic leftover state.
			await removeDirWithRetry(settingsDir);
		}

		let mergedSettings: Record<string, unknown> = getDefaultSettings(this.codeVersion);
		if (Object.keys(this.customSettings).length > 0) {
			console.log('Detected user defined code settings');
			// Several defaults are load-bearing for the framework itself (e.g. custom
			// title bar and dialogs for the page objects, reduced motion for stable
			// waits, disabled updates) — make it visible when custom settings change them.
			const custom = this.customSettings as Record<string, unknown>;
			const overridden = overriddenDefaultKeys(mergedSettings, custom);
			if (overridden.length > 0) {
				const diff = overridden.map((key) => `${key} (${JSON.stringify(mergedSettings[key])} -> ${JSON.stringify(custom[key])})`);
				console.log('\x1b[33m%s\x1b[0m', `WARNING: Custom settings override framework defaults: ${diff.join(', ')}`);
			}
			// CLI flags beat settings.json in VS Code, so settings trying to
			// re-enable what an always-on launch flag disables are silently dead.
			for (const warning of flagConflictWarnings(custom)) {
				console.log('\x1b[33m%s\x1b[0m', `WARNING: ${warning}`);
			}
			mergedSettings = { ...mergedSettings, ...this.customSettings };
		}

		fs.mkdirpSync(path.join(userSettings, 'globalStorage'));
		// tab indentation matches how VS Code itself writes settings.json and keeps
		// the file readable when debugging which settings were actually applied
		fs.writeJSONSync(path.join(userSettings, 'settings.json'), mergedSettings, { spaces: '\t' });
		console.log(`Writing code settings to ${path.join(userSettings, 'settings.json')}`);

		if (this.seedFiles?.keybindings) {
			seedKeybindingsFile(this.seedFiles.keybindings, userSettings);
		}
		if (this.seedFiles?.snippets) {
			seedSnippetsDir(this.seedFiles.snippets, userSettings);
		}

		if (this.locale) {
			fs.writeJSONSync(path.join(userSettings, 'locale.json'), { locale: this.locale, osLocale: this.locale });
			console.log(`Writing locale settings to ${path.join(userSettings, 'locale.json')}`);
		}

		if (languagePacks && Object.keys(languagePacks).length > 0) {
			fs.writeJSONSync(languagePacksPath, languagePacks);
			console.log(`Restored languagepacks.json to ${languagePacksPath}`);
		}
	}

	/**
	 * Launch VS Code with the prepared user data dir. A hidden window restart calls this
	 * directly, so the user data dir keeps what the tests changed, as it does when a
	 * visible window opens another folder.
	 */
	private async launch(codePath: string, resources: string[]): Promise<VSBrowser> {
		const settingsDir = path.join(this.storagePath, 'settings');
		// Crash dumps are redirected into the storage folder so CI can collect
		// them as failure artifacts alongside screenshots and driver logs.
		const crashesDir = path.join(this.storagePath, 'crashes');
		fs.mkdirpSync(crashesDir);

		const args = [
			'--no-sandbox',
			'--disable-dev-shm-usage',
			// Determinism flags used by Microsoft's own harnesses (@vscode/test-electron
			// and the VS Code smoke tests): the updater, experiments and telemetry must
			// not vary behavior mid-run, and workspace trust has to be off from the very
			// first window - the injected settings.json only applies after the profile
			// is read, while the flag applies immediately.
			'--disable-updates',
			'--disable-workspace-trust',
			'--disable-telemetry',
			'--disable-experiments',
			'--no-cached-data',
			'--disable-gpu-sandbox',
			`--crash-reporter-directory=${crashesDir}`,
			`--user-data-dir=${path.join(this.storagePath, 'settings')}`,
		];

		if (this.locale) {
			args.push(`--locale=${this.locale}`);
		}

		if (this.extensionsFolder) {
			args.push(`--extensions-dir=${this.extensionsFolder}`);
		}

		if (process.env.EXTENSION_DEV_PATH) {
			// absolute, so the launch does not depend on the working directory VS Code starts in
			const extensionDevPath = path.resolve(process.env.EXTENSION_DEV_PATH);
			if (!fs.existsSync(extensionDevPath)) {
				console.log('\x1b[33m%s\x1b[0m', `WARNING: EXTENSION_DEV_PATH does not exist: ${extensionDevPath}`);
			}
			args.push(`--extensionDevelopmentPath=${extensionDevPath}`);
		}

		if (this.hiddenWindow) {
			// yellow like the other notices, so it is clear the run uses an experimental mode
			console.log('\x1b[33m%s\x1b[0m', 'Launching VS Code with a hidden window (--hidden-window, experimental)');
			args.push(...hiddenWindowArgs(this.storagePath, !!process.env.EXTENSION_DEV_PATH));
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

		// --enable-chrome-logs routes VS Code's own stdout/stderr into the
		// ChromeDriver log; without it ChromeDriver discards them, and a VS Code
		// that exits during startup leaves no trace of why (#2049).
		// The environment is filtered so that e.g. an inherited ELECTRON_RUN_AS_NODE
		// cannot turn the Electron binary into plain Node.
		const service = new ServiceBuilder(chromeDriverBinaryPath)
			.loggingTo(chromeDriverLog)
			.addArguments(
				...DriverUtil.chromeDriverLogLevelArgs(this.logLevel),
				'--enable-chrome-logs',
				// a hidden window restart starts a new ChromeDriver: keep the log of the earlier sessions
				...(this.appendLogs ? ['--append-log'] : []),
			)
			.setEnvironment(browserLaunchEnvironment(process.env));

		const launchStartedMs = Date.now();
		try {
			this._driver = await new Builder().setChromeService(service).forBrowser(Browser.CHROME).setChromeOptions(options).build();
		} catch (err) {
			if (!isSessionNotCreated(err)) {
				throw err;
			}
			const message = formatLaunchFailure({
				error: err as Error,
				codePath,
				chromeDriverLog,
				userDataDir: settingsDir,
				crashesDir,
				launchStartedMs,
			});
			// rethrow as the same selenium error type so `instanceof` and name
			// checks upstream still recognise it; the original stays as `cause`
			const ErrorType = (err as Error).constructor as new (message: string) => Error;
			throw Object.assign(new ErrorType(message), { cause: err });
		}

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
	 * Warn when a folder being opened carries workspace settings that shadow
	 * the user-supplied custom settings: workspace scope wins over user scope,
	 * so those custom settings silently stop applying once the folder is open
	 * — while the injected settings.json still shows the custom value.
	 */
	private warnShadowedSettings(resources: string[]): void {
		const custom = this.customSettings as Record<string, unknown>;
		if (Object.keys(custom).length === 0) {
			return;
		}
		for (const resource of resources) {
			const resolved = path.resolve(resource);
			const shadowed = findShadowedSettings(resolved, custom);
			if (shadowed.length > 0) {
				const diff = shadowed.map((entry) => `${entry.key} (${JSON.stringify(custom[entry.key])} -> ${JSON.stringify(entry.workspaceValue)})`);
				console.log(
					'\x1b[33m%s\x1b[0m',
					`WARNING: Workspace settings in ${path.join(resolved, '.vscode', 'settings.json')} shadow custom settings: ${diff.join(', ')}`,
				);
			}
		}
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
	 * Whether VS Code runs with a hidden window (experimental `--hidden_window`). VS Code is then in
	 * extension test mode: it never shows dialogs (confirmations are auto-accepted, other
	 * dialogs fail), so suites that test dialogs can skip themselves based on this.
	 */
	get isHiddenWindow(): boolean {
		return this.hiddenWindow;
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
		if (!this._driver) {
			// the session was never created (e.g. VS Code failed to launch): nothing to shut down
			return;
		}
		try {
			const entries = await this._driver.manage().logs().get(logging.Type.DRIVER);
			const logFile = path.join(this.storagePath, 'test.log');
			// a hidden window restart ends a session mid-run: keep the log of the earlier sessions
			const logStream = fs.createWriteStream(logFile, { flags: this.appendLogs ? 'a' : 'w' });
			if (this.appendLogs) {
				logStream.write(`\n----- VS Code restarted at ${new Date().toLocaleTimeString()} -----\n`);
			}
			for (const entry of entries) {
				logStream.write(`[${new Date(entry.timestamp).toLocaleTimeString()}][${entry.level.name}] ${entry.message}`);
			}
			logStream.end();
			this.appendLogs = true;
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
	 * Paths may point to files, folders or `.code-workspace` files; folders and workspace
	 * files replace the current workspace (the window reloads).
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

		this.warnShadowedSettings(paths);
		if (this.hiddenWindow && paths.some(isFolderOrWorkspace)) {
			await this.relaunchWithResources(paths);
			this.opened = trackOpened(this.opened, paths, isFolderOrWorkspace);
			await this.waitForWorkbench(undefined, waitForFn);
			return;
		}
		const code = new CodeUtil(this.storagePath, this.releaseType, this.extensionsFolder);
		code.open(...paths);
		await this.waitForWorkbench(undefined, waitForFn);

		// The CLI open request can occasionally get lost by the running VS Code instance
		// (observed on macOS after a workspace switch reloaded the window). Verify that
		// each file resource actually shows up as an editor tab and retry the open once
		// before giving up, so callers fail fast with a clear error instead of timing
		// out later on a missing editor. Workspace files are opened as a workspace
		// (window reload), never as an editor tab, so they are treated like folders.
		const files = paths.filter((p) => fs.existsSync(p) && fs.statSync(p).isFile() && path.extname(p) !== '.code-workspace');
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
		// tracked only once they are open, so a failed open does not change what a hidden reload reopens
		this.opened = trackOpened(this.opened, paths, isFolderOrWorkspace);
	}

	/**
	 * Reload the VS Code window (`Developer: Reload Window`) and wait until the workbench is back.
	 *
	 * With a hidden window VS Code runs in extension test mode, where it exits instead of reloading.
	 * ExTester then restarts it with the same folder or workspace and reopens the files that were
	 * opened through ExTester (`openResources()` or the launch resources) and are still open, with the
	 * active one last so it is active again. Saved files, settings and files an extension wrote carry
	 * over. Not restored: unsaved changes (hot exit), extension `globalState` and `workspaceState`
	 * (VS Code keeps storage in memory in test mode), the editor layout and groups, editors not opened
	 * through ExTester, and editors reopened with another editor ("Reopen With"). Tests of those still
	 * need a visible window.
	 *
	 * @param waitForFn optional function to run once the workbench is back
	 *
	 * @example
	 * await VSBrowser.instance.reloadWindow(async () => {
	 *   await waitForMyExtensionToActivate();
	 * });
	 */
	async reloadWindow(waitForFn?: () => void | Promise<any>): Promise<void> {
		// the editor tabs and the workbench are in the top document, not in a webview frame a test may have switched to
		await this._driver.switchTo().defaultContent();
		if (this.hiddenWindow) {
			const open = await this.openEditorFiles();
			await this.relaunchWithResources([...this.opened.workspace, ...open]);
			await this.waitForWorkbench(undefined, waitForFn);
			return;
		}
		const workbench = await this._driver.findElement(By.css('.monaco-workbench'));
		await new Workbench().executeCommand('workbench.action.reloadWindow');
		await this._driver.wait(
			async () => {
				try {
					await workbench.isDisplayed();
					return false;
				} catch {
					return true; // the old workbench is gone
				}
			},
			15_000,
			'The window did not reload within 15 s. Something may block it, such as a "Save changes?" dialog when hot exit is off, or the reload command did not run.',
		);
		await this.waitForWorkbench(undefined, waitForFn);
	}

	/** Files opened through ExTester that are still open in an editor and still exist, the active one last. */
	private async openEditorFiles(): Promise<string[]> {
		let titles: string[] = [];
		let activeTitle: string | undefined;
		try {
			titles = await new EditorView().getOpenEditorTitles();
			const active = await this._driver.findElements(By.css('.editor-group-container.active .tab.active'));
			activeTitle = active.length > 0 ? await new EditorTab(active[0], new EditorView()).getTitle() : undefined;
		} catch (err) {
			// only a window without an editor area counts as having no editors open
			if ((err as Error).name !== 'NoSuchElementError') {
				throw err;
			}
		}
		return filesToReopen(this.opened.files, titles, activeTitle);
	}

	/**
	 * Open a folder or workspace in hidden window mode. VS Code's extension test mode
	 * (required for `--hidden-window`) exits instead of switching the window to another
	 * folder, so VS Code is restarted with the resources as launch arguments. The new
	 * session is moved into the existing WebDriver object, so `VSBrowser.instance.driver`
	 * references held by tests stay valid; elements found before go stale, exactly as
	 * they do when a visible window reloads into another folder.
	 */
	private async relaunchWithResources(resources: string[]): Promise<void> {
		if (!this.codePath) {
			throw new Error('Cannot open resources before VS Code was started');
		}
		console.log(`Hidden window: restarting VS Code to open ${resources.join(', ')}`);
		const startedMs = Date.now();
		const driver = this._driver;
		const previousExecutor = driver.getExecutor();
		// WebDriver.quit() returns before closing a BiDi connection when a quit hook is set,
		// as it is for ChromeDriver, so close it here: the new session needs its own.
		await closeBidiConnection(driver);
		await this.quit();
		this.appendLogs = true;
		await this.launch(this.codePath, resources);
		adoptSession(driver, this._driver);
		this._driver = driver;
		forwardToCurrentSession(previousExecutor, driver);
		initPageObjects(this.codeVersion, VSBrowser.baseVersion, getLocatorsPath(), this._driver, VSBrowser.browserName, this.customPageObjects?.locatorsPath);
		console.log(`Hidden window: VS Code restarted in ${Date.now() - startedMs} ms`);
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

/** A folder, or a `.code-workspace` file: opening it switches the window's workspace. */
function isFolderOrWorkspace(resource: string): boolean {
	if (path.extname(resource) === '.code-workspace') {
		return true;
	}
	return fs.existsSync(resource) && fs.statSync(resource).isDirectory();
}
