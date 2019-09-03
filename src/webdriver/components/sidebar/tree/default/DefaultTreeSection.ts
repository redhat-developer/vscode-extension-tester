import { TreeSection } from "../TreeSection";
import { TreeItem } from "../../../../../extester";
import { By, Key } from 'selenium-webdriver';
import { DefaultTreeItem } from "./DefaultTreeItem";

/**
 * Default view section
 */
export class DefaultTreeSection extends TreeSection {
    async getVisibleItems(): Promise<TreeItem[]> {
        const items: TreeItem[] = [];
        const elements = await this.findElements(By.className('monaco-list-row'));
        for (const element of elements) {
            items.push(await new DefaultTreeItem(await element.getAttribute('aria-label'), this).wait());
        }
        return items;
    }

    async findItem(label: string, maxLevel: number = 0): Promise<TreeItem | undefined> {
        await this.expand();
        const container = await this.findElement(By.className('monaco-list'));
        await container.sendKeys(Key.HOME);
        let item: TreeItem | undefined = undefined;
        do {
            try {
                const temp = await container.findElement(By.xpath(`.//div[contains(@class, 'monaco-list-row') and @aria-label='${label}']`));
                const level = +await temp.getAttribute('aria-level');
                if (maxLevel < 1 || level <= maxLevel) {
                    item = new DefaultTreeItem(label, this);
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