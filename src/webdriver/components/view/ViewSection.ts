import { AbstractElement } from "../AbstractElement";
import { ViewContent, ViewItem, waitForAttributeValue } from "../../../extester";
import { By, Key } from "selenium-webdriver";

/**
 * Page object representing a collapsible content section of the side bar view
 */
export class ViewSection extends AbstractElement {
    constructor(title: string, content: ViewContent) {
        super(By.xpath(`.//div[@class='split-view-view' and translate(div/div/h3/text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz')='${title.toLowerCase()}']`), content);
    }

    /**
     * Expand the section if collapsed
     */
    async expand(): Promise<void> {
        if (await this.isHeaderHidden()) {
            return;
        }
        if (!await this.isExpanded()) {
            const panel = await this.findElement(By.className('panel-header'));
            await panel.click();
            await this.getDriver().wait(waitForAttributeValue(panel, 'aria-expanded', 'true'), 1000);
        }
    }

    /**
     * Collapse the section if expanded
     */
    async collapse(): Promise<void> {
        if (await this.isHeaderHidden()) {
            return;
        }
        if (await this.isExpanded()) {
            const panel = await this.findElement(By.className('panel-header'));
            await panel.click();
            await this.getDriver().wait(waitForAttributeValue(panel, 'aria-expanded', 'false'), 1000);
        }
    }

    /**
     * Finds whether the section is expanded
     */
    async isExpanded(): Promise<boolean>  {
        const header = await this.findElement(By.className('panel-header'));
        const expanded = await header.getAttribute('aria-expanded');
        return expanded === 'true';
    }

    /**
     * Retrieve all items currently visible in the view section.
     * Note that any item currently beyond the visible list, i.e. not scrolled to, will not be retrieved.
     * @returns array of ViewItem objects
     */
    async getVisibleItems(): Promise<ViewItem[]> {
        const items: ViewItem[] = [];
        const elements = await this.findElements(By.xpath(`.//div[@class='monaco-list-row']`));
        for (const element of elements) {
            items.push(new ViewItem(await element.getAttribute('aria-label'), this));
        }
        return items;
    }

    /**
     * Find an item in this view section by label. Does not perform recursive search through the whole tree.
     * Does however scroll through all the expanded content. Will find items beyond the current scroll range.
     * @param label Label of the item to search for.
     */
    async findItem(label: string): Promise<ViewItem | undefined> {
        const container = await this.findElement(By.className('monaco-list'));
        await container.sendKeys(Key.HOME);
        let item: ViewItem | undefined = undefined;
        do {
            try {
                await container.findElement(By.xpath(`.//div[contains(@class, 'monaco-list-row') and @aria-label='${label}']`));
                item = new ViewItem(label, this);
            } catch (err) {
                try {
                    await container.findElement(By.xpath(`.//div[@data-last-element='true']`));
                    break;
                } catch (err) {
                    // last element not yet found, continue
                }
                await container.sendKeys(Key.PAGE_DOWN);
            }
        } while (!item)

        return item;
    }

    /**
     * Retrieve the actions buttons on the section's header
     * @returns array of ViewPanelAction objects
     */
    async getActions(): Promise<ViewPanelAction[]> {
        const actions: ViewPanelAction[] = [];

        if (!await this.isHeaderHidden()) {
            const header = await this.findElement(By.className('panel-header'));
            const act = await header.findElement(By.className('actions'));
            const elements = await act.findElements(By.xpath(`.//a[@role='button']`));
    
            for (const element of elements) {
                actions.push(new ViewPanelAction(await element.getAttribute('Title'), this));
            }
        }
        return actions;
    }

    /**
     * Retrieve an action button on the sections's header by its label
     * @param label label/title of the button
     */
    getAction(label: string): ViewPanelAction {
        return new ViewPanelAction(label, this);
    }

    private async isHeaderHidden(): Promise<boolean> {
        const header = await this.findElement(By.className('panel-header'));
        return (await header.getAttribute('class')).indexOf('hidden') > -1;
    }
}

/**
 * Action button on the header of a view section
 */
export class ViewPanelAction extends AbstractElement {
    constructor(label: string, viewPart: ViewSection) {
        super(By.xpath(`.//a[contains(@class, 'action-label') and @role='button' and @title='${label}]'`), viewPart);
    }
}