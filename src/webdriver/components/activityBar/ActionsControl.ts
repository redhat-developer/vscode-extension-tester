import { ActivityBar } from "./ActivityBar";
import { By } from "selenium-webdriver";
import { ContextMenu } from "../menu/ContextMenu";
import { ElementWithContexMenu } from "../ElementWithContextMenu";

/**
 * Page object representing the global action controls on the bottom of the action bar
 */
export class ActionsControl extends ElementWithContexMenu {
    constructor(name: string, bar: ActivityBar) {
        super(By.xpath(`.//li[@aria-label='${name}']`), bar);
    }

    /**
     * Open the context menu bound to this global action
     * @returns ContextMenu object representing the action's menu
     */
    async openActionMenu(): Promise<ContextMenu> {
        return this.openContextMenu();
    }
}