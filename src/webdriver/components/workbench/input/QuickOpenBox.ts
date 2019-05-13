import { Input, QuickPickItem } from "../../../../extester";
import { By, until } from "selenium-webdriver";

/**
 * The quick open box variation of the input
 */
export class QuickOpenBox extends Input {
    constructor() {
        super(By.className('monaco-quick-open-widget'), By.className('monaco-workbench'));
    }

    async hasProgress(): Promise<boolean> {
        const klass = await this.findElement(By.className('monaco-progress-container'))
            .getAttribute('class');
        return klass.indexOf('done') < 0;
    }

    async getQuickPicks(): Promise<QuickPickItem[]> {
        const picks: QuickPickItem[] = [];
        const tree = await this.getDriver().wait(until.elementLocated(By.className('quick-open-tree')), 1000);
        const elements = await tree.findElements(By.xpath(`.//div[@role='treeitem']`));
        for (const element of elements) {
            const index = +await element.getAttribute('aria-posinset');
            picks.push(await new QuickPickItem(index, this).wait());
        }
        return picks;
    }
}