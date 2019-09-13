import { ElementWithContexMenu } from "../ElementWithContextMenu";
import { AbstractElement } from "../AbstractElement";
import { WebElement } from "selenium-webdriver";

/**
 * Arbitrary item in the side bar view
 */
export abstract class ViewItem extends ElementWithContexMenu {
    /**
     * Select the item in the view.
     */
    abstract select(): Promise<void>
}


/**
 * Abstract representation of a row in the tree inside a view content section
 */
export abstract class TreeItem extends ViewItem {
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
     * Select the item in the view.
     * Note that selecting the item will toggle its expand state.
     */
    abstract async select(): Promise<void>

    /**
     * Find children of an item, will try to expand the item in the process
     * @returns an array of ViewItems, empty array if item has no children
     */
    abstract async getChildren(): Promise<TreeItem[]>

    /**
     * Find a child item with the given name
     * @returns ViewItem object if the child item exists, undefined otherwise
     */
    async findChildItem(name: string): Promise<TreeItem | undefined> {
        const children = await this.getChildren();
        const result = children.find(item => {
            return item.getLabel() === name;
        });
        return result;
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
            actions.push(await new ViewItemAction(label, this));
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