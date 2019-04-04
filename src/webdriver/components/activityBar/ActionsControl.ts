import { ActivityBar, ContextMenu } from "../../../extester";
import { ElementWithContexMenu } from "../ElementWithContextMenu";
import { By } from "selenium-webdriver";

/**
 * Page object representing the global action controls on the bottom of the action bar
 */
export class ActionsControl extends ElementWithContexMenu {
    private title: string;

    constructor(title: string, bar: ActivityBar) {
        super(By.xpath(`.//li[@aria-label='${title}']`), bar);
        this.title = title;
    }

    /**
     * Open the context menu bound to this global action
     * @returns ContextMenu object representing the action's menu
     */
    async openActionMenu(): Promise<ContextMenu> {
        return this.openContextMenu();
    }

    /**
     * Returns the title of the associated action
     */
    getTitle(): string {
        return this.title;
    }
}