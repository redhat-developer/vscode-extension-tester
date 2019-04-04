import { AbstractElement } from "../AbstractElement";
import { SideBarView, ViewSection } from "../../../extester";
import { By } from "selenium-webdriver";

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