/* eslint-disable no-redeclare */
import { until, WebElement } from "selenium-webdriver";
import WebviewMixin from "../WebviewMixin";
import { Editor } from "./Editor";

/**
 * Page object representing an open editor containing a web view
 */
class WebViewBase extends Editor {

    async getViewToSwitchTo(handle: string): Promise<WebElement | undefined> {
        const handles = await this.getDriver().getAllWindowHandles();
        for (const handle of handles) {
            await this.getDriver().switchTo().window(handle);

            if ((await this.getDriver().getTitle()).includes('Virtual Document')) {
                await this.getDriver().switchTo().frame(0);
                return;
            }
        }
        await this.getDriver().switchTo().window(handle);

        const reference = await this.findElement(WebViewBase.locators.EditorView.webView);
        const containers = await this.getDriver().wait(until.elementsLocated(WebViewBase.locators.WebView.container(await reference.getAttribute(WebViewBase.locators.WebView.attribute))), 5000);

        return await containers[0].getDriver().wait(async () => {
            for (const container of containers) {
                const tries = await container.findElements(WebViewBase.locators.WebView.iframe);
                if (tries.length > 0) {
                    return tries[0];
                }
            }
            return undefined;
        }, 5000) as WebElement;
    }

}

export const WebView = WebviewMixin(WebViewBase);
export type WebView = InstanceType<typeof WebView>;