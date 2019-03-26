'use strict';

import { WebDriver, Builder, until, By, WebElement } from 'selenium-webdriver';
import { Options } from 'selenium-webdriver/chrome';

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
        this._driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(new Options().setChromeBinaryPath(codePath)
                .addArguments(`--extensionDevelopmentPath=${process.cwd()}`)
            ).build();
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

    /**
     * Finds the element representing a view container
     * @param title title of the view
     */
    async getView(title: string, timeout: number = 2000): Promise<WebElement> {
        return this._driver.wait(until.elementLocated(By.xpath(`//li[@title='${title}']`)), timeout);
    }

    /**
     * Opens a view with the given title
     * @param title title of the view
     */
    async openView(title: string): Promise<void> {
        const view = await this.getView(title);
        await view.click();
    }
}