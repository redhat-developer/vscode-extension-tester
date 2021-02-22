import { TreeItem } from "../../ViewItem";
import { TreeSection } from "../TreeSection";
import { WebElement } from "selenium-webdriver";

/**
 * View item in a custom-made content section (e.g. an extension tree view)
 */
export class CustomTreeItem extends TreeItem {
    constructor(element: WebElement, viewPart: TreeSection) {
        super(element, viewPart);
    }

    async getLabel(): Promise<string> {
        return this.findElement(CustomTreeItem.locators.CustomTreeSection.itemLabel).getText();
    }

    async getTooltip(): Promise<string> {
        return this.getAttribute(CustomTreeItem.locators.CustomTreeItem.tooltipAttribute);
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
        const rows = await this.getChildItems(CustomTreeItem.locators.DefaultTreeSection.itemRow);
        const items = await Promise.all(rows.map(async row => new CustomTreeItem(row, this.enclosingItem as TreeSection).wait()));
        return items;
    }
}