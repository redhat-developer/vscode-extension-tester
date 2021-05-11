import { TextEditor, Menu, MenuItem, DebugConsoleView } from "../..";
import { WebElement } from 'selenium-webdriver';

/**
 * Page object representing the content assistant
 */
export class ContentAssist extends Menu {
    constructor(parent: TextEditor | DebugConsoleView) {
        super(ContentAssist.locators.ContentAssist.constructor, parent);
    }

    /**
     * Get content assist item by name/text
     * @param name name/text to search by
     * @returns Promise resolving to ContentAssistItem object
     */
    async getItem(name: string): Promise<ContentAssistItem | undefined> {
        const items = await this.getItems();
        
        for (const item of items) {
            if (await item.getLabel() === name) {
                return await new ContentAssistItem(item, this).wait();
            }
        }
    }

    /**
     * Get all visible content assist items
     * @returns Promise resolving to array of ContentAssistItem objects
     */
    async getItems(): Promise<ContentAssistItem[]> {
        await this.getDriver().wait(() => { return this.isLoaded(); });

        const elements = await this.findElement(ContentAssist.locators.ContentAssist.itemRows)
            .findElements(ContentAssist.locators.ContentAssist.itemRow);

        return Promise.all(elements.map(async (item) => {
            return await new ContentAssistItem(item, this).wait();
        }));
    }

    /**
     * Find if the content assist is still loading the suggestions
     * @returns promise that resolves to true when suggestions are done loading,
     * to false otherwise
     */
    async isLoaded(): Promise<boolean> {
        const message = await this.findElement(ContentAssist.locators.ContentAssist.message);
        if (await message.isDisplayed()) {
            if ((await message.getText()).startsWith('No suggestions')) {
                return true;
            }
            return false;
        }
        return true;
    }
}

/**
 * Page object for a content assist item
 */
export class ContentAssistItem extends MenuItem {
    constructor(item: WebElement, contentAssist: ContentAssist) {
        super(item, contentAssist);
        this.parent = contentAssist;
    }

    async getLabel(): Promise<string> {
        const labelDiv = await this.findElement(ContentAssist.locators.ContentAssist.itemLabel);
        return labelDiv.getText();
    }
}