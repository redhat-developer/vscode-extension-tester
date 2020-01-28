import { Editor } from "./Editor";
import { Locator, WebElement } from "selenium-webdriver";

/**
 * Page object representing an open editor containing a web view
 */
export class WebView extends Editor {

    private static handle: string | undefined;

    /**
     * Search for an element inside the webview iframe.
     * Requires webdriver being switched to the webview iframe first.
     * (Will attempt to search from the main DOM root otherwise)
     * 
     * @param locator webdriver locator to search by
     * @returns promise resolving to WebElement when found
     */
    async findWebElement(locator: Locator): Promise<WebElement> {
        return this.getDriver().findElement(locator);
    }

    /**
     * Search for all element inside the webview iframe by a given locator
     * Requires webdriver being switched to the webview iframe first.
     * (Will attempt to search from the main DOM root otherwise)
     * 
     * @param locator webdriver locator to search by
     * @returns promise resolving to a list of WebElement objects
     */
    async findWebElements(locator: Locator): Promise<WebElement[]> {
        return this.getDriver().findElements(locator);
    }

    /**
     * Switch the underlying webdriver context to the webview iframe.
     * This allows using the findWebElement methods.
     * Note that only elements inside the webview iframe will be accessible.
     * Use the switchBack method to switch to the original context.
     */
    async switchToFrame(): Promise<void> {
        if (!WebView.handle) {
            WebView.handle = await this.getDriver().getWindowHandle();
        }

        const handles = await this.getDriver().getAllWindowHandles();
        for (const handle of handles) {
			await this.getDriver().switchTo().window(handle);

			if ((await this.getDriver().getTitle()).includes('Virtual Document')) {
				await this.getDriver().switchTo().frame(0);
				return;
			}
		}
    }

    /**
     * Switch the underlying webdriver back to the original window
     */
    async switchBack(): Promise<void> {
        if (!WebView.handle) {
            WebView.handle = await this.getDriver().getWindowHandle();
        }
        return this.getDriver().switchTo().window(WebView.handle);
    }
}