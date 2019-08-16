import { Menu, MenuItem } from "../../../extester";
import { By, WebElement, Key, until } from "selenium-webdriver";

/**
 * Object representing a context menu
 */
export class ContextMenu extends Menu {
    constructor(containingElement: WebElement) {
        super(By.className('monaco-menu-container'), containingElement);
    }

    async getItem(name: string): Promise<ContextMenuItem> {
        await this.findElement(By.xpath(`.//li[a/span/@aria-label='${name}']`));
        return new ContextMenuItem(name, this).wait();
    }

    async getItems(): Promise<ContextMenuItem[]> {
        const items: ContextMenuItem[] = [];
        const elements = await this.findElements(By.className('action-item'));

        for (const element of elements) {
            const klass = await element.getAttribute('class');
            if (klass.indexOf('disabled') < 0) {
                const labelItem = await element.findElement(By.className('action-label'));
                items.push(await new ContextMenuItem(await labelItem.getAttribute('aria-label'), this).wait());
            }
        }
        return items;
    }

    /**
     * Close the context menu
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
        super(By.xpath(`.//li[a/span/@aria-label='${label}']`), parent);
        this.parent = parent;
        this.label = label;
    }

    async select(): Promise<Menu | void> {
        await this.click();
        if (await this.isNesting()) {
            return await new ContextMenu(this).wait();
        }
    }

    private async isNesting(): Promise<boolean> {
        try {
            return await this.findElement(By.className('submenu-indicator')).isDisplayed();
        } catch (err) {
            return false;
        }
    }
}