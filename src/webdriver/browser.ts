'use strict';

import { WebDriver, Builder, until, By } from 'selenium-webdriver';
import { Options } from 'selenium-webdriver/chrome';
import * as path from 'path';
import * as fs from 'fs-extra';
import { Locators } from './locators/locators';
import { LocatorLoader } from './locators/loader';
import { AbstractElement } from './components/AbstractElement';

export class VSBrowser {
    private storagePath: string;
    private customSettings: Object;
    private _driver!: WebDriver;
    private codeVersion: string;
    private _locators!: Locators;
    private static _instance: VSBrowser;

    constructor(codeVersion: string, customSettings: Object = {}) {
        this.storagePath = process.env.TEST_RESOURCES ? process.env.TEST_RESOURCES : path.resolve('test-resources');
        this.customSettings = customSettings;
        this.codeVersion = codeVersion;
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
            "window.newWindowDimensions": "maximized"
        };
        if (Object.keys(this.customSettings).length > 0) {
            console.log('Detected user defined code settings');
            defaultSettings = { ...defaultSettings, ...this.customSettings };
        }

        fs.mkdirpSync(path.join(userSettings, 'globalStorage'));
        fs.remove(path.join(this.storagePath, 'screenshots'));
        if (process.platform === 'win32') {
            fs.copyFileSync(path.resolve(__dirname, '..', '..', 'resources', 'state.vscdb'), path.join(userSettings, 'globalStorage', 'state.vscdb'));
        }
        fs.writeJSONSync(path.join(userSettings, 'settings.json'), defaultSettings);
        console.log(`Writing code settings to ${path.join(userSettings, 'settings.json')}`);
        this._locators = new LocatorLoader(this.codeVersion).loadLocators();
        this._driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(new Options().setChromeBinaryPath(codePath)
            .addArguments(`--user-data-dir=${path.join(this.storagePath, 'settings')}`))
            .build();
        VSBrowser._instance = this;
        AbstractElement.loadLocators(this);
        return this;
    }

    /**
     * Returns a refenrece to the underlying instance of Webdriver
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
     * Returns a reference to the current locators
     */
    get locators(): Locators {
        return this._locators;
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
        await this._driver.wait(until.elementLocated(By.className('monaco-workbench')));
    }

    /**
     * Terminates the webdriver/browser
     */
    async quit(): Promise<void> {
        console.log('Waiting for all webdriver tasks to finish');
        await new Promise((res) => { setTimeout(res, 2000); });
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
}