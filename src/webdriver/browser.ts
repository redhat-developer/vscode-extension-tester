'use strict';

import { WebDriver, Builder, until, By } from 'selenium-webdriver';
import { Options } from 'selenium-webdriver/chrome';

export class VSBrowser {
    private _driver!: WebDriver;
    private static _instance: VSBrowser;

    constructor() {
        VSBrowser._instance = this;
    };

    async start(codePath: string): Promise<VSBrowser> {
        this._driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(new Options().setChromeBinaryPath(codePath)
            .addArguments('--testing', '--extensionDevelopmentPath=${workspaceFolder}'))            
            .build();
        VSBrowser._instance = this;
        return this;
    }

    get driver(): WebDriver {
        return this._driver;
    }

    static get instance(): VSBrowser {
        return VSBrowser._instance;
    }

    async waitForWorkbench(): Promise<void> {
        await this._driver.wait(until.elementLocated(By.id('workbench.parts.titlebar')));
    }

    async quit(): Promise<void> {
        console.log(this._driver);
        await this._driver.quit();
    }
}