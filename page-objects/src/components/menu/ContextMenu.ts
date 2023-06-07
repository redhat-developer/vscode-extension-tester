import { Menu, MenuItem } from "../..";
import { WebElement, Key, until, error } from "selenium-webdriver";

/**
 * Object representing a context menu
 */
export class ContextMenu extends Menu {
    constructor(containingElement: WebElement) {
        super(ContextMenu.locators.ContextMenu.constructor, containingElement);
    }

    /**
     * Get context menu item by name
     * @param name name of the item to search by
     * @returns Promise resolving to ContextMenuItem object
     */
    async getItem(name: string): Promise<ContextMenuItem | undefined> {
        try {
            const items = await this.getItems();
            for (const item of items) {
                if (await item.getLabel() === name) {
                    return item;
                }
            }
        } catch (err) {
            return undefined;
        }
    }

    /**
     * Get all context menu items
     * @returns Promise resolving to array of ContextMenuItem objects
     */
    async getItems(): Promise<ContextMenuItem[]> {
        const items: ContextMenuItem[] = [];
        const elements = await this.findElements(ContextMenu.locators.ContextMenu.itemElement);

        for (const element of elements) {
            const klass = await element.getAttribute('class');
            if (klass.indexOf('disabled') < 0) {
                items.push(await new ContextMenuItem(element, this).wait());
            }
        }
        return items;
    }

    /**
     * Close the context menu
     * @returns Promise resolving when the menu is closed
     */
    async close(): Promise<void> {
        let actions = this.getDriver().actions();
        await actions.clear();
        await this.getDriver().actions().sendKeys(Key.ESCAPE).perform();
        try {
            await this.getDriver().wait(until.elementIsNotVisible(this));
        } catch (err) {
            if (!(err instanceof error.StaleElementReferenceError)) {
                throw err;
            }
        }
    }

    /**
     * Wait for the menu to appear and load all its items
     */
    async wait(timeout: number = 5000): Promise<this> {
        await this.getDriver().wait(until.elementIsVisible(this), timeout);
        let items = (await this.getItems()).length;
        try {
            await this.getDriver().wait(async () => {
                const temp = (await this.getItems()).length;
                if (temp === items) {
                    return true;
                } else {
                    items = temp;
                    return false;
                }
            }, 1000);
        } catch (err) {
            if (err instanceof error.TimeoutError) {
                // ignore timeout
            } else {
                throw err;
            }
        }
        return this;
    }
}

/**
 * Object representing an item of a context menu
 */
export class ContextMenuItem extends MenuItem {

    constructor(item: WebElement, parent: Menu) {
        super(item, parent);
        this.parent = parent;
    }

    async select(): Promise<Menu | undefined> {
        await this.click();
        await new Promise(res => setTimeout(res, 500));
        if (await this.isNesting()) {
            return await new ContextMenu(this).wait();
        }
        return undefined;
    }

    async getLabel(): Promise<string> {
        const labelItem = await this.findElement(ContextMenu.locators.ContextMenu.itemLabel);
        return await labelItem.getAttribute(ContextMenu.locators.ContextMenu.itemText);
    }

    private async isNesting(): Promise<boolean> {
        try {
            return await this.findElement(ContextMenu.locators.ContextMenu.itemNesting).isDisplayed();
        } catch (err) {
            return false;
        }
    }
}