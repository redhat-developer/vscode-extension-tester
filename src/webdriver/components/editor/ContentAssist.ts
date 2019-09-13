import { TextEditor, Menu, MenuItem } from "../../../extester";
import { until } from 'selenium-webdriver';

/**
 * Page object representing the content assistant
 */
export class ContentAssist extends Menu {
    constructor(editor: TextEditor) {
        super(ContentAssist.locators.ContentAssist.constructor, editor);
    }

    async getItem(name: string): Promise<ContentAssistItem> {
        const message = await this.findElement(ContentAssist.locators.ContentAssist.message);
        await this.getDriver().wait(until.elementIsNotVisible(message));

        await this.findElement(ContentAssist.locators.ContentAssist.itemConstructor(name));
        return await new ContentAssistItem(name, this).wait();
    }

    async getItems(): Promise<ContentAssistItem[]> {
        const message = await this.findElement(ContentAssist.locators.ContentAssist.message);
        await this.getDriver().wait(until.elementIsNotVisible(message));

        const items: ContentAssistItem[] = [];
        const elements = await this.findElements(ContentAssist.locators.ContentAssist.itemRow);

        for (const element of elements) {
            const labelDiv = await element.findElement(ContentAssist.locators.ContentAssist.itemLabel);
            const label = await labelDiv.findElement(ContentAssist.locators.ContentAssist.itemText);
            const text = await label.getText();

            const item = await new ContentAssistItem(text, this).wait();
            items.push(item);
        }
        return items;
    }
}

/**
 * Page object for a content assist item
 */
export class ContentAssistItem extends MenuItem {
    constructor(label: string, contentAssist: ContentAssist) {
        super(ContentAssist.locators.ContentAssist.itemConstructor(label), contentAssist);
        this.label = label;
        this.parent = contentAssist;
    }
}