import { AbstractElement } from "../AbstractElement";
import { By } from "selenium-webdriver";
import { ViewControl } from "./ViewControl";
import { ActionsControl } from "./ActionsControl";

/**
 * Page object representing the left side activity bar in VS Code
 */
export class ActivityBar extends AbstractElement {
    constructor() {
        super(By.id('workbench.parts.activitybar'), By.id('workbench.main.container'));
    }

    /**
     * Find all view containers displayed in the activity bar
     * @returns array of ViewControl objects
     */
    async getViews(): Promise<ViewControl[]> {
        const views: ViewControl[] = [];
        const viewContainer = await this.findElement(By.xpath(`.//ul[@aria-label='Active View Switcher']`));
        for(const element of await viewContainer.findElements(By.className('action-item'))) {
            views.push(new ViewControl(await element.getAttribute('aria-label'), this));
        }
        return views;
    }

    /**
     * Find a view with a given title
     * @param name title of the view
     * @returns ViewControl object representing the view selector
     */
    getView(name: string): ViewControl {
        return new ViewControl(name, this);
    }

    /**
     * Find all global action controls displayed on the bottom of the activity bar
     * @returns array of ActionsControl objects
     */
    async getGlobalActions(): Promise<ActionsControl[]> {
        const actions: ActionsControl[] = [];
        const actionContainer = await this.findElement(By.xpath(`.//ul[@aria-label='Global Actions']`));
        for(const element of await actionContainer.findElements(By.className('action-item'))) {
            actions.push(new ActionsControl(await element.getAttribute('aria-label'), this));
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