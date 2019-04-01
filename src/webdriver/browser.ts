'use strict';

import { WebDriver, Builder, until, By } from 'selenium-webdriver';
import { Options } from 'selenium-webdriver/chrome';
import * as path from 'path';
import * as fs from 'fs-extra';

export class VSBrowser {
    private _driver!: WebDriver;
    private static _instance: VSBrowser;

    constructor() {
        VSBrowser._instance = this;
    };

    /**
     * Starts the vscode browser from a given path
     * @param codePath path to code binary
     */
    async start(codePath: string): Promise<VSBrowser> {
        const storagePath = process.env.TEST_RESOURCES ? process.env.TEST_RESOURCES : path.resolve('test-resources');
        const userSettings = path.join(storagePath, 'settings', 'User');
        if (!fs.existsSync(userSettings)) {
            fs.removeSync(path.join(storagePath, 'settings'));
        }
        const defaultSettings = { "window.titleBarStyle": "custom" };
        fs.mkdirpSync(userSettings);
        fs.writeJSONSync(path.join(userSettings, 'settings.json'), defaultSettings);
        console.log(`Writing default settings to ${path.join(userSettings, 'settings.json')}`);

        this._driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(new Options().setChromeBinaryPath(codePath)
            .addArguments(`--extensionDevelopmentPath=${process.cwd()}`, `--user-data-dir=${path.join(storagePath, 'settings')}`))
            .build();
        VSBrowser._instance = this;
        return this;
    }

    /**
     * Returns a refenrece to the underlying instance of Webdriver
     */
    get driver(): WebDriver {
        return this._driver;
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
        await this._driver.wait(until.elementLocated(By.id('workbench.parts.titlebar')));
    }

    /**
     * Terminates the webdriver/browser
     */
    async quit(): Promise<void> {
        await this._driver.quit();
    }
}