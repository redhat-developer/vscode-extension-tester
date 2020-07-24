import { TreeSection } from "../TreeSection";
import { TreeItem } from "../../ViewItem";
import { CustomTreeItem } from "./CustomTreeItem";
import { Key } from "selenium-webdriver";

/**
 * Custom tree view, e.g. contributed by an extension
 */
export class CustomTreeSection extends TreeSection {

    async getVisibleItems(): Promise<TreeItem[]> {
        const items: TreeItem[] = [];
        const elements = await this.findElements(CustomTreeSection.locators.CustomTreeSection.itemRow);
        for (const element of elements) {
            items.push(await new CustomTreeItem(element, this).wait());
        }
        return items;
    }

    async findItem(label: string, maxLevel: number = 0): Promise<TreeItem | undefined> {
        await this.expand();
        const container = await this.findElement(CustomTreeSection.locators.CustomTreeSection.rowContainer);
        await container.sendKeys(Key.HOME);
        let item: TreeItem | undefined = undefined;
        
        const elements = await container.findElements(CustomTreeSection.locators.CustomTreeSection.itemRow);
        for (const element of elements) {
            const temp = await element.findElements(CustomTreeSection.locators.CustomTreeSection.rowWithLabel(label));
            if (temp.length > 0) {
                const level = +await temp[0].getAttribute(CustomTreeSection.locators.ViewSection.level);
                if (maxLevel < 1 || level <= maxLevel) {
                    item = await new CustomTreeItem(element, this).wait();
                } 
            }
        }            
        return item;
    }
}