import { WebElement } from "selenium-webdriver";
import { AbstractElement } from "../AbstractElement";
import WebviewMixin from "../WebviewMixin";

/**
 * Page object representing a user-contributed panel implemented using a Webview.
 */
class WebviewViewBase extends AbstractElement {

    constructor() {
        super(WebviewViewBase.locators.Workbench.constructor);
    }

    async getViewToSwitchTo(handle: string): Promise<WebElement | undefined> {
        return await this.getDriver().findElement(WebviewViewBase.locators.WebviewView.iframe);
    }

}

export const WebviewView = WebviewMixin(WebviewViewBase);
export type WebviewView = InstanceType<typeof WebviewView>;