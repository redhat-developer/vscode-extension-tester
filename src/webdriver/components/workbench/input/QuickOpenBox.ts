import { Input, QuickPickItem } from "../../../../extester";
import { until } from "selenium-webdriver";

/**
 * @deprecated as of VS Code 1.44.0, quick open box has been replaced with input box
 * The quick open box variation of the input
 */
export class QuickOpenBox extends Input {
    constructor() {
        super(QuickOpenBox.locators.QuickOpenBox.constructor, QuickOpenBox.locators.Workbench.constructor);
    }

    /**
     * Construct a new QuickOpenBox instance after waiting for its underlying element to exist
     * Use when a quick open box is scheduled to appear.
     */
    static async create(): Promise<QuickOpenBox> {
        await QuickOpenBox.driver.wait(until.elementLocated(QuickOpenBox.locators.QuickOpenBox.constructor));
        return new QuickOpenBox().wait();
    }

    async hasProgress(): Promise<boolean> {
        const klass = await this.findElement(QuickOpenBox.locators.QuickOpenBox.progress)
            .getAttribute('class');
        return klass.indexOf('done') < 0;
    }

    async getQuickPicks(): Promise<QuickPickItem[]> {
        const picks: QuickPickItem[] = [];
        const tree = await this.getDriver().wait(until.elementLocated(QuickOpenBox.locators.QuickOpenBox.quickList), 1000);
        const elements = await tree.findElements(QuickOpenBox.locators.QuickOpenBox.row);
        for (const element of elements) {
            const index = +await element.getAttribute('aria-posinset');
            if (await element.isDisplayed()) {
                picks.push(await new QuickPickItem(index, this).wait());
            }
        }
        return picks;
    }
}