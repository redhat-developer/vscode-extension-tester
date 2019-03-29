import { AbstractElement } from "./AbstractElement";
import { ContextMenu, By, Button } from "../../extester";

/**
 * Abstract element that has a context menu
 */
export abstract class ElementWithContexMenu extends AbstractElement {

    /**
     * Open context menu on the element
     */
    async openContextMenu(): Promise<ContextMenu> {
        const workbench = await this.getDriver().findElement(By.id('workbench.main.container'));
        const menu = await workbench.findElement(By.className('context-view'));
        const hidden = await menu.getAttribute('aria-hidden');

        let klass = await menu.getAttribute('class');
        if (!hidden || klass.indexOf('monaco-menu-container') > 0) {
            await this.getDriver().actions().click(this, Button.RIGHT).perform();
        }
        await this.getDriver().actions().click(this, Button.RIGHT).perform();

        return new ContextMenu(workbench).wait();
    }
}