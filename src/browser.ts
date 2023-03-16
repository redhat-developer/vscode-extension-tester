'use strict';

import * as path from 'path';
import * as fs from 'fs-extra';
import { compareVersions } from 'compare-versions';
import { WebDriver, Builder, until, initPageObjects, logging, By } from 'monaco-page-objects';
import { Options } from 'selenium-webdriver/chrome';
import { getLocatorsPath } from 'vscode-extension-tester-locators';
import { CodeUtil, ReleaseQuality } from './util/codeUtil';

export class VSBrowser {
    static readonly baseVersion = '1.37.0';
    static readonly browserName = 'vscode';
    private storagePath: string;
    private extensionsFolder: string | undefined;
    private customSettings: Object;
    private _driver!: WebDriver;
    private codeVersion: string;
    private releaseType: ReleaseQuality;
    private logLevel: logging.Level;
    private static _instance: VSBrowser;

    constructor(codeVersion: string, releaseType: ReleaseQuality, customSettings: Object = {}, logLevel: logging.Level = logging.Level.INFO) {
        this.storagePath = process.env.TEST_RESOURCES ? process.env.TEST_RESOURCES : path.resolve('test-resources');
        this.extensionsFolder = process.env.EXTENSIONS_FOLDER ? process.env.EXTENSIONS_FOLDER : undefined;
        this.customSettings = customSettings;
        this.codeVersion = codeVersion;
        this.releaseType = releaseType;

        this.logLevel = logLevel;

        VSBrowser._instance = this;
    };

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
            "window.titleBarStyle": "custom",
            "workbench.editor.enablePreview": false,
            "window.restoreFullscreen": true,
            "window.newWindowDimensions": "maximized",
            "security.workspace.trust.enabled": false,
            "window.dialogStyle": "custom",
            "files.simpleDialog.enable": true,
            "terminal.integrated.copyOnSelection": true
        };
        if (Object.keys(this.customSettings).length > 0) {
            console.log('Detected user defined code settings');
            defaultSettings = { ...defaultSettings, ...this.customSettings };
        }

        fs.mkdirpSync(path.join(userSettings, 'globalStorage'));
        await fs.remove(path.join(this.storagePath, 'screenshots'));
        fs.writeJSONSync(path.join(userSettings, 'settings.json'), defaultSettings);
        console.log(`Writing code settings to ${path.join(userSettings, 'settings.json')}`);
        
        const args = ['--no-sandbox', '--disable-dev-shm-usage', `--user-data-dir=${path.join(this.storagePath, 'settings')}`];

        if (this.extensionsFolder) {
            args.push(`--extensions-dir=${this.extensionsFolder}`);
        }

        if (compareVersions(this.codeVersion, '1.39.0') < 0) {
            if (process.platform === 'win32') {
                fs.copyFileSync(path.resolve(__dirname, '..', '..', 'resources', 'state.vscdb'), path.join(userSettings, 'globalStorage', 'state.vscdb'));
            }
            args.push(`--extensionDevelopmentPath=${process.cwd()}`);
        }

        let options = new Options().setChromeBinaryPath(codePath).addArguments(...args) as any;
        options['options_'].windowTypes = ['webview'];
        options = options as Options;

        const prefs = new logging.Preferences();
        prefs.setLevel(logging.Type.DRIVER, this.logLevel);
        options.setLoggingPrefs(prefs);

        console.log('Launching browser...');
        this._driver = await new Builder()
            .forBrowser('chrome')
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
     * Waits until parts of the workbench are loaded
     */
    async waitForWorkbench(): Promise<void> {
        // Workaround/patch for https://github.com/redhat-developer/vscode-extension-tester/issues/466
        try {
            await this._driver.wait(until.elementLocated(By.className('monaco-workbench')));
        } catch (err) {
            if((err as Error).name === 'WebDriverError') {
                await new Promise(res => setTimeout(res, 3000));
            } else {
                throw err;
            }
        }
    }

    /**
     * Terminates the webdriver/browser
     */
    async quit(): Promise<void> {
        const entries = await this._driver.manage().logs().get(logging.Type.DRIVER);
        const logFile = path.join(this.storagePath, 'test.log');
        const stream = fs.createWriteStream(logFile, { flags: 'w' });
        entries.forEach(entry => {
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
        const dir = path.join(this.storagePath, 'screenshots');
        fs.mkdirpSync(dir);
        fs.writeFileSync(path.join(dir, `${name}.png`), data, 'base64');
    }

    /**
     * Open folder(s) or file(s) in the current instance of vscode.
     * 
     * @param paths path(s) of folder(s)/files(s) to open as varargs
     * @returns Promise resolving when all selected resources are opened and the workbench reloads
     */
    async openResources(...paths: string[]): Promise<void> {
        if (paths.length === 0) {
            return;
        }

        const code = new CodeUtil(this.storagePath, this.releaseType, this.extensionsFolder);
        code.open(...paths);
        await new Promise(res => setTimeout(res, 3000));
        await this.waitForWorkbench();
    }
}