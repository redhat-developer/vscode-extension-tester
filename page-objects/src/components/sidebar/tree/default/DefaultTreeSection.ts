import { TreeSection } from "../TreeSection";
import { TreeItem } from "../../../..";
import { Key } from 'selenium-webdriver';
import { DefaultTreeItem } from "./DefaultTreeItem";

/**
 * Default view section
 */
export class DefaultTreeSection extends TreeSection {
    async getVisibleItems(): Promise<TreeItem[]> {
        const items: TreeItem[] = [];
        const elements = await this.findElements(DefaultTreeSection.locators.DefaultTreeSection.itemRow);
        for (const element of elements) {
            items.push(await new DefaultTreeItem(await element.getAttribute(DefaultTreeSection.locators.DefaultTreeSection.itemLabel), this).wait());
        }
        return items;
    }

    async findItem(label: string, maxLevel: number = 0): Promise<TreeItem | undefined> {
        await this.expand();
        const container = await this.findElement(DefaultTreeSection.locators.DefaultTreeSection.rowContainer);
        await container.sendKeys(Key.HOME);
        let item: TreeItem | undefined = undefined;
        do {
            try {
                const temp = await container.findElement(DefaultTreeSection.locators.DefaultTreeItem.constructor(label));
                const level = +await temp.getAttribute(DefaultTreeSection.locators.ViewSection.level);
                if (maxLevel < 1 || level <= maxLevel) {
                    item = new DefaultTreeItem(label, this);
                }
            } catch (err) {
                try {
                    await container.findElement(DefaultTreeSection.locators.DefaultTreeSection.lastRow);
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