import { By, WebElement } from "selenium-webdriver";
import { AbstractElement } from "../AbstractElement";

/**
 * Page Object for Custom Style Modal Dialogs (non-native)
 */
export class ModalDialog extends AbstractElement {
    constructor() {
        super(By.className('monaco-dialog-box'));
    }

    /**
     * Get the dialog's message in a Promise
     */
    async getMessage(): Promise<string> {
        const message = await this.findElement(By.className('dialog-message-text'));
        return message.getText();
    }

    /**
     * Get the details message in a Promise
     */
    async getDetails(): Promise<string> {
        const details = await this.findElement(By.className('dialog-message-detail'));
        return details.getText();
    }

    /**
     * Get the list of buttons as WebElements
     * 
     * @returns Promise resolving to Array of WebElement items representing the buttons
     */
    async getButtons(): Promise<WebElement[]> {
        return this.findElement(By.className('dialog-buttons-row')).findElements(By.className('monaco-text-button'));
    }

    /**
     * Push a button with given title if it exists
     * 
     * @param title title/text of the button
     */
    async pushButton(title: string): Promise<void> {
        const buttons = await this.getButtons();
        const titles = await Promise.all(buttons.map(async btn => btn.getAttribute('title')));
        const index = titles.findIndex(value => value === title);
        if (index > -1) {
            await buttons[index].click();
        }
    }
}