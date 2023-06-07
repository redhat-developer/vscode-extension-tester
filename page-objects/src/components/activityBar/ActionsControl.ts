import { WebElement } from "selenium-webdriver";
import { ActivityBar, ContextMenu } from "../..";
import { ElementWithContexMenu } from "../ElementWithContextMenu";

/**
 * Page object representing the global action controls on the bottom of the action bar
 */
export class ActionsControl extends ElementWithContexMenu {
    constructor(element: WebElement, bar: ActivityBar) {
        super(element, bar);
    }

    /**
     * Open the context menu bound to this global action
     * @returns Promise resolving to ContextMenu object representing the action's menu
     */
    async openActionMenu(): Promise<ContextMenu> {
        return await this.openContextMenu();
    }

    /**
     * Returns the title of the associated action
     */
    async getTitle(): Promise<string> {
        return await this.getAttribute('aria-label');
    }
}