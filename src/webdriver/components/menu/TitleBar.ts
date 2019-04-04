import { WindowControls, Menu, MenuItem, ContextMenu } from "../../../extester";
import { By } from "selenium-webdriver";

/**
 * Page object representing the custom VSCode title bar
 */
export class TitleBar extends Menu {
    constructor() {
        super(By.id('workbench.parts.titlebar'), By.id('workbench.main.container'));
    }

    async hasItem(name: string): Promise<boolean> {
        const displayed = (await this.getItem(name)).isDisplayed();
        return displayed;
    }

    getItem(name: string): TitleBarItem {
        return new TitleBarItem(name, this);
    }

    async getItems(): Promise<TitleBarItem[]> {
        const items: TitleBarItem[] = [];
        const elements = await this.findElements(By.className('menubar-menu-button'));

        for (const element of elements) {
            items.push(new TitleBarItem(await element.getAttribute('aria-label'), this));
        }
        return items;
    }

    /**
     * Get the window title
     */
    async getTitle(): Promise<string> {
        return this.findElement(By.className('window-title')).getText();
    }

    getWindowControls(): WindowControls {
        return new WindowControls(this);
    }
}

/**
 * Page object representing an item of the custom VSCode title bar
 */
export class TitleBarItem extends MenuItem {
    constructor(label: string, parent: Menu) {
        super(By.xpath(`.//div[@aria-label='${label}']`), parent);
        this.parent = parent;
        this.label = label;
    }

    async select(): Promise<ContextMenu> {
        // because we are not moving the mouse, we might need 2 clicks when another item is open
        for (let index = 0; index < 2; index++) {
            const klass = await this.getAttribute('class');
            if (klass.indexOf('open') < 0) {
                await this.click();
            }
        }
        return await new ContextMenu(this).wait();
    }
}
