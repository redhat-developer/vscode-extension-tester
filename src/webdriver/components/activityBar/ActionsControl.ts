import { AbstractElement } from "../AbstractElement";
import { ActivityBar } from "./ActivityBar";
import { By } from "selenium-webdriver";
import { ContextMenu } from "../menu/ContextMenu";

/**
 * Page object representing the global action controls on the bottom of the action bar
 */
export class ActionsControl extends AbstractElement {
    constructor(name: string, bar: ActivityBar) {
        super(By.xpath(`.//li[@aria-label='${name}']`), bar);
    }

    /**
     * Open the context menu bound to this global action
     * @returns ContextMenu object representing the action's menu
     */
    async openActionMenu(): Promise<ContextMenu> {
        const workbench = await this.getDriver().findElement(By.id('workbench.main.container'));
        const menu = await workbench.findElement(By.className('context-view'));
        const hidden = await menu.getAttribute('aria-hidden');
        const klass = await menu.getAttribute('class');
        if (hidden === 'true' || klass.indexOf('monaco-menu-container') < 0) {
            await this.click();
        }

        return new ContextMenu(workbench).wait();
    }
}