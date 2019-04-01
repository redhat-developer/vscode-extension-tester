import { AbstractElement } from "../AbstractElement";
import { SideBarView } from "../../../extester";
import { By } from "selenium-webdriver";
import { ElementWithContexMenu } from "../ElementWithContextMenu";
import { waitForAttributeValue } from "../../conditions/WaitForAttribute";

export class ViewContent extends AbstractElement {
    constructor(view: SideBarView) {
        super(By.className('content'), view);
    }

    async hasProgress(): Promise<boolean> {
        const progress = await this.findElement(By.className('monaco-progress-container'));
        const hidden = await progress.getAttribute('aria-hidden');
        if (hidden === 'true') {
            return false;
        }
        return true;
    }

    async getSection(title: string): Promise<ViewSection> {
        return new ViewSection(title, this);
    }

    async getSections(): Promise<ViewSection[]> {
        const sections: ViewSection[] = [];
        const elements = await this.findElements(By.className('split-view-view'));
        for (const element of elements) {
            const title = await element.findElement(By.xpath(`.//h3[@class='title']`)).getText();
            sections.push(new ViewSection(title, this));
        }
        return sections;
    }
}

export class ViewSection extends ElementWithContexMenu {
    constructor(title: string, content: ViewContent) {
        super(By.xpath(`.//div[@class='split-view-view' and translate(div/div/h3/text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz')='${title.toLowerCase()}']`), content);
    }

    async expand(): Promise<void> {
        if (!await this.isExpanded()) {
            const panel = await this.findElement(By.className('panel-header'));
            await panel.click();
            await this.getDriver().wait(waitForAttributeValue(panel, 'aria-expanded', 'true'), 1000);
        }
    }

    async collapse(): Promise<void> {
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
}

export class ViewItem extends ElementWithContexMenu {

}