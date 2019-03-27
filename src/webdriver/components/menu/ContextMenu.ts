import { Menu } from "./Menu";
import { MenuItem } from "./MenuItem";
import { By, WebElement } from "selenium-webdriver";

/**
 * Object representing a context menu
 */
export class ContextMenu extends Menu {
    constructor(containingElement: WebElement) {
        super(By.className('monaco-menu-container'), containingElement);
    }

    async hasItem(name: string): Promise<boolean> {
        const displayed = (await this.getItem(name)).isDisplayed();
        return displayed;
    }

    getItem(name: string): ContextMenuItem {
        return new ContextMenuItem(name, this);
    }

    async getItems(): Promise<ContextMenuItem[]> {
        const items: ContextMenuItem[] = [];
        const elements = await this.findElements(By.className('action-item'));

        for (const element of elements) {
            const klass = await element.getAttribute('class');
            if (klass.indexOf('disabled') < 0) {
                const labelItem = await element.findElement(By.className('action-label'));
                items.push(new ContextMenuItem(await labelItem.getAttribute('aria-label'), this));
            }
        }
        return items;
    }
}

/**
 * Object representing an item of a context menu
 */
export class ContextMenuItem extends MenuItem {
    constructor(name: string, parent: Menu) {
        super(By.xpath(`.//li[a/span/text()='${name}']`), parent);
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