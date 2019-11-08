import { TextEditor, Menu, MenuItem } from "../../../extester";
import { until, WebElement } from 'selenium-webdriver';

/**
 * Page object representing the content assistant
 */
export class ContentAssist extends Menu {
    constructor(editor: TextEditor) {
        super(ContentAssist.locators.ContentAssist.constructor, editor);
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
        const message = await this.findElement(ContentAssist.locators.ContentAssist.message);
        await this.getDriver().wait(until.elementIsNotVisible(message));

        const elements = await this.findElement(ContentAssist.locators.ContentAssist.itemRows)
            .findElements(ContentAssist.locators.ContentAssist.itemRow);

        return Promise.all(elements.map(async (item) => {
            return await new ContentAssistItem(item, this).wait();
        }));
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
        const label = await labelDiv.findElement(ContentAssist.locators.ContentAssist.itemText);
        return label.getText();
    }
}