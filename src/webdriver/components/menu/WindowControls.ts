import { AbstractElement } from "../AbstractElement";
import { TitleBar } from "../../../extester";
import { By, WebElement } from "selenium-webdriver";

/**
 * Page object for the windows controls part of the title bar
 */
export class WindowControls extends AbstractElement {
    constructor(bar: TitleBar) {
        super(By.className('window-controls-container'), bar);
    }

    /**
     * Use the minimize window button
     */
    async minimize(): Promise<void> {
        const minButton = this.findElement(By.className('window-minimize'));
        await minButton.click();
    }

    /**
     * Use the maximize window button if the window is not maximized
     */
    async maximize(): Promise<void> {
        let maxButton: WebElement;
        try {
            maxButton = await this.findElement(By.className('window-maximize'));
            await maxButton.click();
        } catch (err) {
            console.log('Window is already maximized');
        }
    }

    /**
     * Use the restore window button if the window is maximized
     */
    async restore(): Promise<void> {
        let maxButton: WebElement;
        try {
            maxButton = await this.findElement(By.className('window-unmaximize'));
            await maxButton.click();
        } catch (err) {
            console.log('Window is not maximized');
        }
    }

    /**
     * Use the window close button. Use at your own risk.
     */
    async close(): Promise<void> {
        const closeButton = this.findElement(By.className('window-close'));
        await closeButton.click();
    }
}