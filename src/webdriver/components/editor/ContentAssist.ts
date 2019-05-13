import { Editor, Menu, MenuItem } from "../../../extester";
import { By } from 'selenium-webdriver';

/**
 * Page object representing the content assistant
 */
export class ContentAssist extends Menu {
    constructor(editor: Editor) {
        super(By.className('suggest-widget'), editor);
    }

    async hasItem(name: string): Promise<boolean> {
        return await this.getItem(name).isDisplayed();
    }

    getItem(name: string): ContentAssistItem {
        return new ContentAssistItem(name, this);
    }

    async getItems(): Promise<ContentAssistItem[]> {
        const items: ContentAssistItem[] = [];
        const elements = await this.findElements(By.className('monaco-list-row'));

        for (const element of elements) {
            const labelDiv = await element.findElement(By.className('label-name'));
            const label = await labelDiv.findElement(By.xpath(`./span/span`));
            const text = await label.getText();

            items.push(await new ContentAssistItem(text, this).wait());
        }
        return items;
    }
}

/**
 * Page object for a content assist item
 */
export class ContentAssistItem extends MenuItem {
    constructor(label: string, contentAssist: ContentAssist) {
        super(By.xpath(`.//div[contains(@class, 'monaco-list-row') and div/div/div/div/a/span/span/text()='${label}']`), contentAssist);
    }
}