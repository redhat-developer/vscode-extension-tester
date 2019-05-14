import { ViewSection } from "../ViewSection";
import { ViewItem } from "../../../../extester";
import { By, Key } from 'selenium-webdriver';
import { DefaultViewItem } from "./DefaultViewItem";

/**
 * Default view section
 */
export class DefaultViewSection extends ViewSection {
    async getVisibleItems(): Promise<ViewItem[]> {
        const items: ViewItem[] = [];
        const elements = await this.findElements(By.className('monaco-list-row'));
        for (const element of elements) {
            items.push(await new DefaultViewItem(await element.getAttribute('aria-label'), this).wait());
        }
        return items;
    }

    async findItem(label: string, maxLevel: number = 0): Promise<ViewItem | undefined> {
        await this.expand();
        const container = await this.findElement(By.className('monaco-list'));
        await container.sendKeys(Key.HOME);
        let item: ViewItem | undefined = undefined;
        do {
            try {
                const temp = await container.findElement(By.xpath(`.//div[contains(@class, 'monaco-list-row') and @aria-label='${label}']`));
                const level = +await temp.getAttribute('aria-level');
                if (maxLevel < 1 || level <= maxLevel) {
                    item = new DefaultViewItem(label, this);
                }
            } catch (err) {
                try {
                    await container.findElement(By.xpath(`.//div[@data-last-element='true']`));
                    break;
                } catch (err) {
                    // last element not yet found, continue
                }
                await container.sendKeys(Key.PAGE_DOWN);
            }
        } while (!item)

        return item;
    }
}