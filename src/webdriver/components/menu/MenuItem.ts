import { AbstractElement } from "../AbstractElement";
import { Menu } from "./Menu";

/**
 * Abstract element representing a menu item
 */
export abstract class MenuItem extends AbstractElement {
    protected parent!: Menu;

    /**
     * Use the given menu item: Opens the submenu if the item has children,
     * otherwise simply click the item.
     * 
     * @returns Menu object representing the submenu if the item has children, void otherwise.
     */
    async select(): Promise<Menu | void> {
        await this.click();
    }

    /**
     * Return the Menu object representing the menu this item belongs to
     */
    getParent(): Menu {
        return this.parent;
    }
}