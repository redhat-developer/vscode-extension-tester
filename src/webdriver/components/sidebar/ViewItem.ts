import { ElementWithContexMenu } from "../ElementWithContextMenu";
import { ViewSection } from "../../../extester";
import { By, WebElement } from "selenium-webdriver";

/**
 * Page object representing a row in the tree inside a view content section
 */
export class ViewItem extends ElementWithContexMenu {
    private label: string;

    constructor(label: string, viewPart: ViewSection) {
        super(By.xpath(`.//div[contains(@class, 'monaco-list-row') and @aria-label='${label}']`), viewPart);
        this.label = label;
    }

    /**
     * Retrieves the label of this view item
     */
    getLabel(): string {
        return this.label;
    }

    /**
     * Finds whether the item has children (whether it is collapsible)
     */
    async hasChildren(): Promise<boolean> {
        const twistieClass = await this.findElement(By.className('monaco-tl-twistie')).getAttribute('class');
        return twistieClass.indexOf('collapsible') > -1;
    }

    /**
     * Finds whether the item is expanded. Always returns false if item has no children.
     */
    async isExpanded(): Promise<boolean> {
        const twistieClass = await this.findElement(By.className('monaco-tl-twistie')).getAttribute('class');
        return twistieClass.indexOf('collapsed') < 0;
    }

    /**
     * Select the item in the view and returns all child items if it ends up expanded.
     * Note that selecting the item will toggle its expand state.
     * @returns an array of ViewItems, empty array if item has no children
     */
    async select(): Promise<ViewItem[]> {
        await this.click();
        const items: ViewItem[] = [];

        if (await this.getAttribute('aria-expanded') === 'true') {
            const rows = await this.enclosingItem.findElements(By.className('monaco-list-row'));
            const nextRowIndex = await this.findNextRow(rows);
            const nextRow = rows[nextRowIndex];
            const setSize = +await nextRow.getAttribute('aria-setsize');
            const startPosition = +await nextRow.getAttribute('aria-posinset');
            const level = +await nextRow.getAttribute('aria-level');

            for (let i = nextRowIndex; i < rows.length; i++) {
                const setSize1 = +await rows[i].getAttribute('aria-setsize');
                const position = +await rows[i].getAttribute('aria-posinset');
                const level1 = +await rows[i].getAttribute('aria-level');

                if (setSize1 === setSize && position >= startPosition && position <= setSize && level1 === level) {
                    items.push(new ViewItem(await rows[i].getAttribute('aria-label'), <ViewSection>this.enclosingItem));
                }
                if (items.length >= setSize) {
                    break;
                }
            }
        }
        return items;
    }

    /**
     * Collapse the item if expanded
     */
    async collapse(): Promise<void> {
        if (await this.hasChildren() && await this.isExpanded()) {
            await this.click();
        }
    }

    private async findNextRow(rows: WebElement[]): Promise<number> {
        for (let i = 0; i < rows.length; i++) {
            const label = await rows[i].getAttribute('aria-label');
            if (label === this.label) {
                return i + 1;
            }
        }
        throw new Error('No other row found');
    }
}