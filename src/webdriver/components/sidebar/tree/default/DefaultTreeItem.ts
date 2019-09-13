import { TreeItem } from "../../ViewItem";
import { WebElement } from 'selenium-webdriver';
import { TreeSection } from "../TreeSection";

/**
 * Default tree item base on the items in explorer view
 */
export class DefaultTreeItem extends TreeItem {
    constructor(label: string, viewPart: TreeSection) {
        super(DefaultTreeItem.locators.DefaultTreeItem.constructor(label), viewPart);
        this.label = label;
    }

    async hasChildren(): Promise<boolean> {
        const twistieClass = await this.findElement(DefaultTreeItem.locators.DefaultTreeItem.twistie).getAttribute('class');
        return twistieClass.indexOf('collapsible') > -1;
    }

    async isExpanded(): Promise<boolean> {
        const twistieClass = await this.findElement(DefaultTreeItem.locators.DefaultTreeItem.twistie).getAttribute('class');
        return twistieClass.indexOf('collapsed') < 0;
    }

    async getChildren(): Promise<TreeItem[]>{
        const items: TreeItem[] = [];
        if (!await this.isExpanded() && await this.hasChildren()) {
            await this.click();
        }

        const rows = await this.enclosingItem.findElements(DefaultTreeItem.locators.DefaultTreeSection.itemRow);
        const baseIndex = await this.findRowIndex(rows);
        const baseLevel = +await this.getAttribute(DefaultTreeItem.locators.ViewSection.level);

        for (let i = baseIndex; i < rows.length; i++) {
            if (i === baseIndex) { continue; }
            const level = +await rows[i].getAttribute(DefaultTreeItem.locators.ViewSection.level);

            if (level > baseLevel + 1) { continue; }
            if (level <= baseLevel) { break; }

            const label = await rows[i].getAttribute(DefaultTreeItem.locators.DefaultTreeSection.itemLabel);
            items.push(await new DefaultTreeItem(label, <TreeSection>this.enclosingItem).wait());
        }

        return items;
    }

    async select(): Promise<void> {
        await this.click();
    }

    private async findRowIndex(rows: WebElement[]): Promise<number> {
        for (let i = 0; i < rows.length; i++) {
            const label = await rows[i].getAttribute(DefaultTreeItem.locators.DefaultTreeSection.itemLabel);
            if (label === this.label) {
                return i;
            }
        }
        throw new Error(`Failed to locate row ${this.getLabel()}`);
    }
}