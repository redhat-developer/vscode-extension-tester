import { TextEditor, Menu, MenuItem, DebugConsoleView } from "../..";
import { error, Key, WebElement } from 'selenium-webdriver';

/**
 * Page object representing the content assistant
 */
export class ContentAssist extends Menu {
    constructor(parent: TextEditor | DebugConsoleView) {
        super(ContentAssist.locators.ContentAssist.constructor, parent);
    }

    /**
     * Get content assist item by name/text, scroll through the list
     * until the item is found, or the end is reached
     * 
     * @param name name/text to search by
     * @returns Promise resolving to ContentAssistItem object if found, undefined otherwise
     */
    async getItem(name: string): Promise<ContentAssistItem | undefined> {
        let lastItem = false;
        const scrollable = await this.findElement(ContentAssist.locators.ContentAssist.itemList);

        let firstItem = await this.findElements(ContentAssist.locators.ContentAssist.firstItem);
        while(firstItem.length < 1) {
            await scrollable.sendKeys(Key.PAGE_UP, Key.NULL);
            firstItem = await this.findElements(ContentAssist.locators.ContentAssist.firstItem);
        }

        while(!lastItem) {
            const items = await this.getItems();
            
            for (const item of items) {
                if (await item.getLabel() === name) {
                    return item;
                }
                lastItem = lastItem ? lastItem : (await item.getAttribute('data-last-element')) === 'true';
            }
            if (!lastItem) {
                await scrollable.sendKeys(Key.PAGE_DOWN);
                await new Promise(res => setTimeout(res, 100));
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
        const items: ContentAssistItem[] = [];

        for (const item of elements) {
            try {
                items.push(await new ContentAssistItem(item, this).wait());
            } catch (err) {
                if (!(err instanceof error.StaleElementReferenceError)) {
                    throw err;
                }
            }
        }
        return items;
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