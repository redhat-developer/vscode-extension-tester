import { ActionsControl, ViewControl } from "../../../extester";
import { ElementWithContexMenu } from "../ElementWithContextMenu";
import { By } from "selenium-webdriver";

/**
 * Page object representing the left side activity bar in VS Code
 */
export class ActivityBar extends ElementWithContexMenu {
    constructor() {
        super(By.id('workbench.parts.activitybar'), By.className('monaco-workbench'));
    }

    /**
     * Find all view containers displayed in the activity bar
     * @returns array of ViewControl objects
     */
    async getViewControls(): Promise<ViewControl[]> {
        const views: ViewControl[] = [];
        const viewContainer = await this.findElement(By.xpath(`.//ul[@aria-label='Active View Switcher']`));
        for(const element of await viewContainer.findElements(By.className('action-item'))) {
            views.push(await new ViewControl(await element.getAttribute('aria-label'), this).wait());
        }
        return views;
    }

    /**
     * Find a view container with a given title
     * @param name title of the view
     * @returns ViewControl object representing the view selector
     */
    getViewControl(name: string): ViewControl {
        return new ViewControl(name, this);
    }

    /**
     * Find all global action controls displayed on the bottom of the activity bar
     * @returns array of ActionsControl objects
     */
    async getGlobalActions(): Promise<ActionsControl[]> {
        const actions: ActionsControl[] = [];
        const actionContainer = await this.findElement(By.className('actions-container'));
        for(const element of await actionContainer.findElements(By.className('action-item'))) {
            actions.push(await new ActionsControl(await element.getAttribute('aria-label'), this).wait());
        }
        return actions;
    }

    /**
     * Find an action control with a given title
     * @param name title of the global action
     * @returns ActionsControl object representing the action selector
     */
    getGlobalAction(name: string): ActionsControl {
        return new ActionsControl(name, this);
    }
}