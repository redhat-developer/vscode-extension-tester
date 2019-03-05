'use strict';

import { WebDriver, Builder, until, By } from 'selenium-webdriver';
import { Options } from 'selenium-webdriver/chrome';

export class Browser {
    private _driver!: WebDriver;
    private static _instance: Browser;

    constructor() {
        Browser._instance = this;
    };

    async start(codePath: string): Promise<Browser> {
        this._driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(new Options().setChromeBinaryPath(codePath)
            .addArguments('--testing', '--extensionDevelopmentPath=${workspaceFolder}'))            
            .build();
        Browser._instance = this;
        return this;
    }

    get driver(): WebDriver {
        return this._driver;
    }

    static get instance(): Browser {
        return Browser._instance;
    }

    async waitForWorkbench(): Promise<void> {
        await this._driver.wait(until.elementLocated(By.id('workbench.parts.titlebar')));
    }

    async quit(): Promise<void> {
        console.log(this._driver);
        await this._driver.quit();
    }
}