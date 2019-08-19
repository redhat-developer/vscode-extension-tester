import { AbstractElement } from "./AbstractElement";
import { ContextMenu } from "../../extester";
import { By, Button, until } from 'selenium-webdriver';

/**
 * Abstract element that has a context menu
 */
export abstract class ElementWithContexMenu extends AbstractElement {

    /**
     * Open context menu on the element
     */
    async openContextMenu(): Promise<ContextMenu> {
        const workbench = await this.getDriver().findElement(By.className('monaco-workbench'));
        const menu = await workbench.findElement(By.className('context-view'));

        if (await menu.isDisplayed()) {
            await this.getDriver().actions().click(this, Button.RIGHT).perform();
            try {
                await this.getDriver().wait(until.elementIsNotVisible(this), 1000);
            } catch (err) {
                if (err.message.indexOf('stale element reference: element is not attached to the page document') < 0) {
                    throw err;
                }
            }
        }
        await this.getDriver().actions().click(this, Button.RIGHT).perform();

        return new ContextMenu(workbench).wait();
    }
}