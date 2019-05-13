import { ViewItem } from "../ViewItem";
import { ViewSection } from "../../../../extester";
import { By, WebElement } from 'selenium-webdriver';

/**
 * Default tree item base on the items in explorer view
 */
export class DefaultViewItem extends ViewItem {
    constructor(label: string, viewPart: ViewSection) {
        super(By.xpath(`.//div[@role='treeitem' and @aria-label='${label}']`), viewPart);
        this.label = label;
    }

    async hasChildren(): Promise<boolean> {
        const twistieClass = await this.findElement(By.className('monaco-tl-twistie')).getAttribute('class');
        return twistieClass.indexOf('collapsible') > -1;
    }

    async isExpanded(): Promise<boolean> {
        const twistieClass = await this.findElement(By.className('monaco-tl-twistie')).getAttribute('class');
        return twistieClass.indexOf('collapsed') < 0;
    }

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
                    items.push(await new DefaultViewItem(await rows[i].getAttribute('aria-label'), <ViewSection>this.enclosingItem).wait());
                }
                if (items.length >= setSize) {
                    break;
                }
            }
        }
        return items;
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