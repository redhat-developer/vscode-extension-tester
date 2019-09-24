import { ActionsControl, ViewControl } from "../../../extester";
import { ElementWithContexMenu } from "../ElementWithContextMenu";

/**
 * Page object representing the left side activity bar in VS Code
 */
export class ActivityBar extends ElementWithContexMenu {
    constructor() {
        super(ActivityBar.locators.ActivityBar.constructor, ActivityBar.locators.Workbench.constructor);
    }

    /**
     * Find all view containers displayed in the activity bar
     * @returns Promise resolving to array of ViewControl objects
     */
    async getViewControls(): Promise<ViewControl[]> {
        const views: ViewControl[] = [];
        const viewContainer = await this.findElement(ActivityBar.locators.ActivityBar.viewContainer);
        for(const element of await viewContainer.findElements(ActivityBar.locators.ActivityBar.actionItem)) {
            views.push(await new ViewControl(await element.getAttribute(ActivityBar.locators.ActivityBar.label), this).wait());
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
     * @returns Promise resolving to array of ActionsControl objects
     */
    async getGlobalActions(): Promise<ActionsControl[]> {
        const actions: ActionsControl[] = [];
        const actionContainer = await this.findElement(ActivityBar.locators.ActivityBar.actionsContainer);
        for(const element of await actionContainer.findElements(ActivityBar.locators.ActivityBar.actionItem)) {
            actions.push(await new ActionsControl(await element.getAttribute(ActivityBar.locators.ActivityBar.label), this).wait());
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