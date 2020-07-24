import { ElementWithContexMenu } from "../ElementWithContextMenu";
import { AbstractElement } from "../AbstractElement";
import { WebElement, By } from "selenium-webdriver";

/**
 * Arbitrary item in the side bar view
 */
export abstract class ViewItem extends ElementWithContexMenu {
    /**
     * Select the item in the view.
     * Note that selecting the item will toggle its expand state when applicable.
     * @returns Promise resolving when the item has been clicked
     */    
    async select(): Promise<void> {
        await this.click();
    }
}


/**
 * Abstract representation of a row in the tree inside a view content section
 */
export abstract class TreeItem extends ViewItem {
    /**
     * Retrieves the label of this view item
     */
    async getLabel(): Promise<string> {
        return '';
    }

    /**
     * Finds whether the item has children (whether it is collapsible)
     * @returns Promise resolving to true/false
     */
    abstract async hasChildren(): Promise<boolean>

    /**
     * Finds whether the item is expanded. Always returns false if item has no children.
     * @returns Promise resolving to true/false
     */
    abstract async isExpanded(): Promise<boolean>

    /**
     * Find children of an item, will try to expand the item in the process
     * @returns Promise resolving to array of TreeItem objects, empty array if item has no children
     */
    abstract async getChildren(): Promise<TreeItem[]>

    /**
     * Find a child item with the given name
     * @returns Promise resolving to TreeItem object if the child item exists, undefined otherwise
     */
    async findChildItem(name: string): Promise<TreeItem | undefined> {
        const children = await this.getChildren();
        for (const item of children) {
            if (await item.getLabel() === name) {
                return item;
            }
        }
    }

    /**
     * Collapse the item if expanded
     */
    async collapse(): Promise<void> {
        if (await this.hasChildren() && await this.isExpanded()) {
            await this.click();
        }
    }

    /**
     * Find all action buttons bound to the view item
     * 
     * @returns array of ViewItemAction objects, empty array if item has no
     * actions associated
     */
    async getActionButtons(): Promise<ViewItemAction[]> {
        let container: WebElement;
        try {
            container = await this.findElement(TreeItem.locators.TreeItem.actions);
        } catch(err) {
            return [];
        }
        const actions: ViewItemAction[] = [];
        const items = await container.findElements(TreeItem.locators.TreeItem.actionLabel);
        
        for (const item of items) {
            const label = await item.getAttribute(TreeItem.locators.TreeItem.actionTitle);
            actions.push(new ViewItemAction(label, this));
        }
        return actions;
    }

    /**
     * Find action button for view item by label
     * @param label label of the button to search by
     * 
     * @returns ViewItemAction object if such button exists, undefined otherwise
     */
    async getActionButton(label: string): Promise<ViewItemAction | undefined> {
        const actions = await this.getActionButtons();
        if (actions.length > 0) {
            return actions.find((item) => { return item.getLabel().indexOf(label) > -1; });
        } else {
            return undefined;
        }
    }

    /**
     * Find all child elements of a tree item
     * @param locator locator of a given type of tree item
     */
    protected async getChildItems(locator: By): Promise<WebElement[]> {
        const items: WebElement[] = [];
        if (!await this.isExpanded() && this.hasChildren()) {
            await this.click();
        }
        const rows = await this.enclosingItem.findElements(locator);
        const baseIndex = +await this.getAttribute(TreeItem.locators.ViewSection.index);
        const baseLevel = +await this.getAttribute(TreeItem.locators.ViewSection.level);

        for (const row of rows) {
            const level = +await row.getAttribute(TreeItem.locators.ViewSection.level);
            const index = +await row.getAttribute(TreeItem.locators.ViewSection.index);

            if (index <= baseIndex) { continue; }
            if (level > baseLevel + 1) { continue; }
            if (level <= baseLevel) { break; }

            items.push(row);
        }

        return items;
    }
}

/**
 * Action button bound to a view item
 */
export class ViewItemAction extends AbstractElement {
    private label: string;

    constructor(label: string, viewItem: TreeItem) {
        super(ViewItemAction.locators.ViewSection.actionConstructor(label), viewItem);
        this.label = label;
    }

    /**
     * Get label of the action button
     */
    getLabel(): string {
        return this.label;
    }
}