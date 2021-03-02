import { Key } from "selenium-webdriver";
import { WindowControls, ContextMenu } from "../..";
import { Menu } from "./Menu";
import { MenuItem } from "./MenuItem";

/**
 * Page object representing the custom VSCode title bar
 */
export class TitleBar extends Menu {
    constructor() {
        super(TitleBar.locators.TitleBar.constructor, TitleBar.locators.Workbench.constructor);
    }

    /**
     * Get title bar item by name
     * @param name name of the item to search by
     * @returns Promise resolving to TitleBarItem object
     */
    async getItem(name: string): Promise<TitleBarItem | undefined> {
        try {
            await this.findElement(TitleBar.locators.TitleBar.itemConstructor(name));
            return await new TitleBarItem(name, this).wait();
        } catch (err) {
            return undefined;
        }
    }

    /**
     * Get all title bar items
     * @returns Promise resolving to array of TitleBarItem objects
     */
    async getItems(): Promise<TitleBarItem[]> {
        const items: TitleBarItem[] = [];
        const elements = await this.findElements(TitleBar.locators.TitleBar.itemElement);

        for (const element of elements) {
            if (await element.isDisplayed()) {
                items.push(await new TitleBarItem(await element.getAttribute(TitleBar.locators.TitleBar.itemLabel), this).wait());
            }
        }
        return items;
    }

    /**
     * Get the window title
     * @returns Promise resolving to the window title
     */
    async getTitle(): Promise<string> {
        return this.findElement(TitleBar.locators.TitleBar.title).getText();
    }

    /**
     * Get a reference to the WindowControls
     */
    getWindowControls(): WindowControls {
        return new WindowControls(this);
    }
}

/**
 * Page object representing an item of the custom VSCode title bar
 */
export class TitleBarItem extends MenuItem {
    constructor(label: string, parent: Menu) {
        super(TitleBar.locators.TitleBar.itemConstructor(label), parent);
        this.parent = parent;
        this.label = label;
    }

    async select(): Promise<ContextMenu> {
        const openMenus = await this.getDriver().findElements(TitleBar.locators.ContextMenu.constructor);
        if (openMenus.length > 0 && openMenus[0].isDisplayed()) {
            await this.getDriver().actions().sendKeys(Key.ESCAPE).perform();
        }
        await this.click();
        return new ContextMenu(this).wait();
    }
}
