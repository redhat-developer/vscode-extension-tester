import { AbstractElement } from "../AbstractElement";
import { ActivityBar } from "./ActivityBar";
import { By } from "selenium-webdriver";
import { View } from "../view/View";

/**
 * Page object representing a view container item in the activity bar
 */
export class ViewControl extends AbstractElement {
    constructor(name: string, bar: ActivityBar) {
        super(By.xpath(`.//li[contains(@aria-label, '${name}')]`), bar);
    }

    /**
     * Opens the associated view if not already open
     * @returns View object representing the opened view
     */
    async openView(): Promise<View> {
        const klass = await this.getAttribute('class');
        if (klass.indexOf('checked') < 0) {
            await this.click();
        }
        return new View().wait();
    }

    /**
     * Closes the associated view if not already closed
     */
    async closeView(): Promise<void> {        
        const klass = await this.getAttribute('class');
        if (klass.indexOf('checked') > -1) {
            await this.click();
        }
    }
}