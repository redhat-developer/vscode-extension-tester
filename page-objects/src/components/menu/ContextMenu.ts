import { Menu, MenuItem } from "../..";
import { WebElement, Key, until } from "selenium-webdriver";

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
            await this.findElement(ContextMenu.locators.ContextMenu.itemConstructor(name));
            return new ContextMenuItem(name, this).wait();
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
                const labelItem = await element.findElement(ContextMenu.locators.ContextMenu.itemLabel);
                items.push(await new ContextMenuItem(await labelItem.getAttribute(ContextMenu.locators.ContextMenu.itemText), this).wait());
            }
        }
        return items;
    }

    /**
     * Close the context menu
     * @returns Promise resolving when the menu is closed
     */
    async close(): Promise<void> {
        await this.getDriver().actions().sendKeys(Key.ESCAPE).perform();
        try {
            await this.getDriver().wait(until.elementIsNotVisible(this));
        } catch (err) {
            if (err.message.indexOf('stale element reference: element is not attached to the page document') < 0) {
                throw err;
            }
        }
    }
}

/**
 * Object representing an item of a context menu
 */
export class ContextMenuItem extends MenuItem {
    constructor(label: string, parent: Menu) {
        super(ContextMenu.locators.ContextMenu.itemConstructor(label), parent);
        this.parent = parent;
        this.label = label;
    }

    async select(): Promise<Menu | undefined> {
        await this.click();
        if (await this.isNesting()) {
            return await new ContextMenu(this).wait();
        }
        return undefined;
    }

    private async isNesting(): Promise<boolean> {
        try {
            return await this.findElement(ContextMenu.locators.ContextMenu.itemNesting).isDisplayed();
        } catch (err) {
            return false;
        }
    }
}