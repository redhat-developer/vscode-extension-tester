import { TreeSection } from "../TreeSection";
import { TreeItem } from "../../ViewItem";
import { CustomTreeItem } from "./CustomTreeItem";
import { By, Key } from "selenium-webdriver";

/**
 * Custom tree view, e.g. contributed by an extension
 */
export class CustomTreeSection extends TreeSection {

    async getVisibleItems(): Promise<TreeItem[]> {
        const items: TreeItem[] = [];
        const elements = await this.findElements(By.className('monaco-tree-row'));
        for (const element of elements) {
            const label = await element.findElement(By.className('monaco-highlighted-label')).getText();
            items.push(await new CustomTreeItem(label, this).wait());
        }
        return items;
    }

    async findItem(label: string, maxLevel: number = 0): Promise<TreeItem | undefined> {
        await this.expand();
        const container = await this.findElement(By.className('monaco-tree'));
        await container.sendKeys(Key.HOME);
        let item: TreeItem | undefined = undefined;
        try {
            const temp = await container.findElement(By.xpath(`.//div[contains(@class, 'monaco-tree-row')]`))
                .findElement(By.xpath(`.//span[contains(text(), '${label}')]`));
            const level = +await temp.getAttribute('aria-level');
            if (maxLevel < 1 || level <= maxLevel) {
                item = new CustomTreeItem(label, this);
            }
        } catch (err) {
            console.log(err);
        }
        return item;
    }
}