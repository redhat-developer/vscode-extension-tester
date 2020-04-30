import { ActivityBar, SideBarView } from "../..";
import { ElementWithContexMenu } from "../ElementWithContextMenu";

/**
 * Page object representing a view container item in the activity bar
 */
export class ViewControl extends ElementWithContexMenu {
    private title: string;

    constructor(title: string, bar: ActivityBar) {
        super(ViewControl.locators.ViewControl.constructor(title), bar);
        this.title = title;
    }

    /**
     * Opens the associated view if not already open
     * @returns Promise resolving to SideBarView object representing the opened view
     */
    async openView(): Promise<SideBarView> {
        const klass = await this.getAttribute(ViewControl.locators.ViewControl.attribute);
        if (klass.indexOf(ViewControl.locators.ViewControl.klass) < 0) {
            await this.click();
            await ViewControl.driver.sleep(500);
        }
        return new SideBarView().wait();
    }

    /**
     * Closes the associated view if not already closed
     * @returns Promise resolving when the view closes
     */
    async closeView(): Promise<void> {        
        const klass = await this.getAttribute(ViewControl.locators.ViewControl.attribute);
        if (klass.indexOf(ViewControl.locators.ViewControl.klass) > -1) {
            await this.click();
        }
    }

    /**
     * Returns the title of the associated view
     */
    getTitle(): string {
        return this.title;
    }
}