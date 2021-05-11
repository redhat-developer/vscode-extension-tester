import { By, until, WebElement } from "selenium-webdriver";
import { AbstractElement } from "../AbstractElement";
import { Workbench } from "./Workbench";

/**
 * Page object for the Debugger Toolbar
 */
export class DebugToolbar extends AbstractElement {
    constructor() {
        super(By.className('debug-toolbar'), new Workbench());
    }

    /**
     * Wait for the debug toolbar to appear and instantiate it.
     * Assumes that debug session is already starting and it is just
     * a matter of waiting for the toolbar to appear.
     * 
     * @param timeout max time to wait in milliseconds, default 5000
     */
    static async create(timeout = 5000): Promise<DebugToolbar> {
        await DebugToolbar.driver.wait(until.elementLocated(By.className('debug-toolbar')), timeout);
        return new DebugToolbar().wait(timeout);
    }

    /**
     * Wait for the execution to pause at the next breakpoint
     */
    async waitForBreakPoint(): Promise<void> {
        const btn = await this.getDriver().wait(until.elementLocated(By.className('codicon-debug-continue')));
        await this.getDriver().wait(until.elementIsEnabled(btn));
    }

    /**
     * Click Continue
     */
    async continue(): Promise<void> {
        await (await this.getButton('continue')).click();
    }

    /**
     * Click Pause
     */
    async pause(): Promise<void> {
        await (await this.getButton('pause')).click();
    }

    /**
     * Click Step Over
     */
    async stepOver(): Promise<void> {
        await (await this.getButton('step-over')).click();
    }

    /**
     * Click Step Into
     */
    async stepInto(): Promise<void> {
        await (await this.getButton('step-into')).click();
    }

    /**
     * Click Step Out
     */
    async stepOut(): Promise<void> {
        await (await this.getButton('step-out')).click();
    }

    /**
     * Click Restart
     */
    async restart(): Promise<void> {
        await (await this.getButton('restart')).click();
    }

    /**
     * Click Stop
     */
    async stop(): Promise<void> {
        await (await this.getButton('stop')).click();
    }

    private async getButton(name: string): Promise<WebElement> {
        return this.findElement(By.className(`codicon-debug-${name}`));
    }
}