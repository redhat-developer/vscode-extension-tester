import { ElementWithContexMenu } from "../ElementWithContextMenu";

/**
 * Page object representing a row in the tree inside a view content section
 */
export abstract class ViewItem extends ElementWithContexMenu {
    protected label!: string;

    /**
     * Retrieves the label of this view item
     */
    getLabel(): string {
        return this.label;
    }

    /**
     * Finds whether the item has children (whether it is collapsible)
     */
    abstract async hasChildren(): Promise<boolean>

    /**
     * Finds whether the item is expanded. Always returns false if item has no children.
     */
    abstract async isExpanded(): Promise<boolean>

    /**
     * Select the item in the view and returns all child items if it ends up expanded.
     * Note that selecting the item will toggle its expand state.
     * @returns an array of ViewItems, empty array if item has no children
     */
    abstract async select(): Promise<ViewItem[]>

    /**
     * Collapse the item if expanded
     */
    async collapse(): Promise<void> {
        if (await this.hasChildren() && await this.isExpanded()) {
            await this.click();
        }
    }
}