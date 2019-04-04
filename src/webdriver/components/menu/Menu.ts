import { AbstractElement } from "../AbstractElement";
import { MenuItem } from "../../../extester";

/**
 * Abstract element representing a menu
 */
export abstract class Menu extends AbstractElement {
    
    /**
     * Find whether the menu has an item of a given name
     * @param name name of the item to search for
     * @returns true if menu has an item with the given name, false otherwise
     */
    abstract hasItem(name: string): Promise<boolean>;

    /**
     * Return a menu item of a given name
     * @param name name of the item to search for
     */
    abstract getItem(name: string): MenuItem;

    /**
     * Get all items of a menu
     * @returns array of MenuItem object representing the menu items
     */
    abstract getItems(): Promise<MenuItem[]>;
}