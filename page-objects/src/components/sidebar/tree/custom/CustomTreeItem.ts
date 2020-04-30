import { TreeItem } from "../../ViewItem";
import { WebElement } from "selenium-webdriver";
import { TreeSection } from "../TreeSection";

/**
 * View item in a custom-made content section (e.g. an extension tree view)
 */
export class CustomTreeItem extends TreeItem {
    constructor(label: string, viewPart: TreeSection) {
        super(CustomTreeItem.locators.CustomTreeItem.constructor(label), viewPart);
        this.label = label;
    }

    async hasChildren(): Promise<boolean> {
        const attr = await this.getAttribute(CustomTreeItem.locators.CustomTreeItem.expandedAttr);
        return attr !== null;
    }

    async isExpanded(): Promise<boolean> {
        const attr = await this.getAttribute(CustomTreeItem.locators.CustomTreeItem.expandedAttr);
        return attr === CustomTreeItem.locators.CustomTreeItem.expandedValue;
    }

    async getChildren(): Promise<TreeItem[]> {
        const items: TreeItem[] = [];
        if (!await this.isExpanded() && this.hasChildren()) {
            await this.click();
        }
        const rows = await this.enclosingItem.findElements(CustomTreeItem.locators.CustomTreeSection.itemRow);
        const baseIndex = await this.findRowIndex(rows);
        const baseLevel = +await rows[baseIndex].getAttribute(CustomTreeItem.locators.ViewSection.level);

        for (let i = baseIndex + 1; i < rows.length; i++) {
            const level = +await rows[i].getAttribute(CustomTreeItem.locators.ViewSection.level);

            if (level > baseLevel + 1) { continue; }
            if (level <= baseLevel) { break; }

            const label = await rows[i].findElement(CustomTreeItem.locators.CustomTreeSection.itemLabel).getText();
            items.push(await new CustomTreeItem(label, <TreeSection>this.enclosingItem).wait());
        }

        return items;
    }

    private async findRowIndex(rows: WebElement[]): Promise<number> {
        for (let i = 0; i < rows.length; i++) {
            const label = await rows[i].findElement(CustomTreeItem.locators.CustomTreeSection.itemLabel).getText();
            if (label === this.label) {
                return i;
            }
        }
        throw new Error(`Failed to locate row ${this.getLabel()}`);
    }
}