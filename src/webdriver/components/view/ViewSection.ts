import { AbstractElement } from "../AbstractElement";
import { ViewContent, ViewItem, waitForAttributeValue } from "../../../extester";
import { By } from "selenium-webdriver";


export class ViewSection extends AbstractElement {
    constructor(title: string, content: ViewContent) {
        super(By.xpath(`.//div[@class='split-view-view' and translate(div/div/h3/text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz')='${title.toLowerCase()}']`), content);
    }

    async expand(): Promise<void> {
        if (await this.isHeaderHidden()) {
            return;
        }
        if (!await this.isExpanded()) {
            const panel = await this.findElement(By.className('panel-header'));
            await panel.click();
            await this.getDriver().wait(waitForAttributeValue(panel, 'aria-expanded', 'true'), 1000);
        }
    }

    async collapse(): Promise<void> {
        if (await this.isHeaderHidden()) {
            return;
        }
        if (await this.isExpanded()) {
            const panel = await this.findElement(By.className('panel-header'));
            await panel.click();
            await this.getDriver().wait(waitForAttributeValue(panel, 'aria-expanded', 'false'), 1000);
        }
    }

    async isExpanded(): Promise<boolean>  {
        const header = await this.findElement(By.className('panel-header'));
        const expanded = await header.getAttribute('aria-expanded');
        return expanded === 'true';
    }

    async getVisibleItems(): Promise<ViewItem[]> {
        const items: ViewItem[] = [];
        const elements = await this.findElements(By.xpath(`.//div[@class='monaco-list-row']`));
        for (const element of elements) {
            items.push(new ViewItem(await element.getAttribute('aria-label'), this));
        }
        return items;
    }

    private async isHeaderHidden(): Promise<boolean> {
        const header = await this.findElement(By.className('panel-header'));
        return (await header.getAttribute('class')).indexOf('hidden') > -1;
    }
}