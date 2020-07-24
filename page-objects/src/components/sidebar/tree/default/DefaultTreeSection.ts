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
            items.push(await new DefaultTreeItem(element, this).wait());
        }
        return items;
    }

    async findItem(label: string, maxLevel: number = 0): Promise<TreeItem | undefined> {
        await this.expand();
        const container = await this.findElement(DefaultTreeSection.locators.DefaultTreeSection.rowContainer);
        await container.sendKeys(Key.HOME);
        let item: TreeItem | undefined = undefined;
        do {
            const temp = await container.findElements(DefaultTreeSection.locators.DefaultTreeItem.constructor(label));
            if (temp.length > 0) {
                const level = +await temp[0].getAttribute(DefaultTreeSection.locators.ViewSection.level);
                if (maxLevel < 1 || level <= maxLevel) {
                    item = await new DefaultTreeItem(temp[0], this).wait();
                }
            } else {
                const lastrow = await container.findElements(DefaultTreeSection.locators.DefaultTreeSection.lastRow);
                if (lastrow.length > 0) {
                    break;
                }
                await container.sendKeys(Key.PAGE_DOWN);
            }
        } while (!item)

        return item;
    }
}