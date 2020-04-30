import { AbstractElement } from "../AbstractElement";
import { Menu } from "./Menu";

/**
 * Abstract element representing a menu item
 */
export abstract class MenuItem extends AbstractElement {
    protected parent!: Menu;
    protected label!: string;

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

    /**
     * Returns the label of the menu item
     */
    getLabel(): string | Promise<string> {
        return this.label;
    }
}