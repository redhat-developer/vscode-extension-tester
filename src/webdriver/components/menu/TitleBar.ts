import { WindowControls, ContextMenu } from "../../../extester";
import { Menu } from "./Menu";
import { MenuItem } from "./MenuItem";

/**
 * Page object representing the custom VSCode title bar
 */
export class TitleBar extends Menu {
    constructor() {
        super(TitleBar.locators.TitleBar.constructor, TitleBar.locators.Workbench.constructor);
    }

    async getItem(name: string): Promise<TitleBarItem> {
        await this.findElement(TitleBar.locators.TitleBar.itemConstructor(name));
        return await new TitleBarItem(name, this).wait();
    }

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
     */
    async getTitle(): Promise<string> {
        return this.findElement(TitleBar.locators.TitleBar.title).getText();
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
        super(TitleBar.locators.TitleBar.itemConstructor(label), parent);
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
