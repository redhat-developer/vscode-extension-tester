import { ViewItem } from "../ViewItem";
import { ViewSection } from "../ViewSection";
import { By, WebElement } from "selenium-webdriver";

/**
 * View item in a custom-made content section (e.g. an extension tree view)
 */
export class CustomViewItem extends ViewItem {
    constructor(label: string, viewPart: ViewSection) {
        super(By.xpath(`.//div[@role='treeitem' and .//span[text()='${label}']]`), viewPart);
        this.label = label;
    }

    async hasChildren(): Promise<boolean> {
        const klass = await this.getAttribute('class');
        return klass.indexOf('has-children') > -1;
    }

    async isExpanded(): Promise<boolean> {
        const klass = await this.getAttribute('class');
        return klass.indexOf('expanded') > -1;
    }

    async getChildren(): Promise<ViewItem[]> {
        const items: ViewItem[] = [];
        if (!await this.isExpanded() && this.hasChildren()) {
            await this.click();
        }
        const rows = await this.enclosingItem.findElements(By.className('monaco-tree-row'));
        const baseIndex = await this.findRowIndex(rows);
        const baseLevel = +await this.getAttribute('aria-level');

        for (let i = baseIndex; i < rows.length; i++) {
            if (i === baseIndex) { continue; }
            const level = +await rows[i].getAttribute('aria-level');

            if (level > baseLevel + 1) { continue; }
            if (level <= baseLevel) { break; }

            const label = await rows[i].findElement(By.className('monaco-highlighted-label')).getText();
            items.push(await new CustomViewItem(label, <ViewSection>this.enclosingItem).wait());
        }

        return items;
    }

    async select(): Promise<void> {
        await this.click();
    }

    private async findRowIndex(rows: WebElement[]): Promise<number> {
        for (let i = 0; i < rows.length; i++) {
            const label = await rows[i].findElement(By.className('monaco-highlighted-label')).getText();
            if (label === this.label) {
                return i;
            }
        }
        throw new Error(`Failed to locate row ${this.getLabel()}`);
    }
}