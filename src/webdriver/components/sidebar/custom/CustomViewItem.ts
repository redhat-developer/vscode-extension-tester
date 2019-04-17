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

    async select(): Promise<ViewItem[]> {
        await this.click();
        const items: ViewItem[] = [];

        if (await this.isExpanded()) {
            const rows = await this.enclosingItem.findElements(By.className('monaco-tree-row'));
            const nextRowIndex = await this.findNextRow(rows);
            const nextRow = rows[nextRowIndex];
            const level = +await nextRow.getAttribute('aria-level');

            for (let i = nextRowIndex; i < rows.length; i++) {
                const level1 = +await rows[i].getAttribute('aria-level');

                if (level1 > level) {
                    continue;
                }
                if (level1 < level) {
                    break;
                }
                const label = await rows[i].findElement(By.className('monaco-highlighted-label')).getText();
                items.push(new CustomViewItem(label, <ViewSection>this.enclosingItem));
            }
        }
        return items;
    }

    private async findNextRow(rows: WebElement[]): Promise<number> {
        for (let i = 0; i < rows.length; i++) {
            const label = await rows[i].findElement(By.className('monaco-highlighted-label')).getText();
            if (label === this.label) {
                return i + 1;
            }
        }
        throw new Error('No other row found');
    }
}