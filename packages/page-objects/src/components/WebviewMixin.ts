import { Locator, WebElement, until } from "selenium-webdriver";
import { AbstractElement } from "./AbstractElement";

/**
 * Heavily inspired by https://stackoverflow.com/a/65418734
 */

type Constructor<T = {}> = new (...args: any[]) => T;

/**
 * The interface that a class is required to have in order to use the Webview mixin.
 */
interface WebviewMixable extends AbstractElement {
    getViewToSwitchTo(handle: string): Promise<WebElement | undefined>;
}

/**
 * The interface that is exposed by applying this mixin.
 */
export interface WebviewMixinType {
    findWebElement(locator: Locator): Promise<WebElement>;
    findWebElements(locator: Locator): Promise<WebElement[]>;
    switchToFrame(timeout?: number): Promise<void>;
    switchBack(): Promise<void>;
}

/**
 * Returns a class that has the ability to access a webview.
 *
 * @param Base the class to mixin
 * @returns a class that has the ability to access a webview
 */
export default function <TBase extends Constructor<WebviewMixable>>(
    Base: TBase
): Constructor<InstanceType<TBase> & WebviewMixinType> {
    return class extends Base implements WebviewMixinType {
        /**
         * Cannot use static element, since this class is unnamed.
         */
        private handle: string | undefined;

        /**
         * Search for an element inside the webview iframe.
         * Requires webdriver being switched to the webview iframe first.
         * (Will attempt to search from the main DOM root otherwise)
         *
         * @param locator webdriver locator to search by
         * @returns promise resolving to WebElement when found
         */
        async findWebElement(locator: Locator): Promise<WebElement> {
            return await this.getDriver().findElement(locator);
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
            return await this.getDriver().findElements(locator);
        }

        /**
         * Switch the underlying webdriver context to the webview iframe.
         * This allows using the findWebElement methods.
         * Note that only elements inside the webview iframe will be accessible.
         * Use the switchBack method to switch to the original context.
         */
        async switchToFrame(timeout: number = 5000): Promise<void> {
            if (!this.handle) {
                this.handle = await this.getDriver().getWindowHandle();
            }

            const view = await this.getViewToSwitchTo(this.handle);

            if (!view) {
                return;
            }

            await this.getDriver().switchTo().frame(view);

            await this.getDriver().wait(
                until.elementLocated(AbstractElement.locators.WebView.activeFrame),
                timeout
            );
            const frame = await this.getDriver().findElement(
                AbstractElement.locators.WebView.activeFrame
            );
            await this.getDriver().switchTo().frame(frame);
        }

        /**
         * Switch the underlying webdriver back to the original window
         */
        async switchBack(): Promise<void> {
            if (!this.handle) {
                this.handle = await this.getDriver().getWindowHandle();
            }
            return await this.getDriver().switchTo().window(this.handle);
        }
    } as unknown as Constructor<InstanceType<TBase> & WebviewMixinType>;
}
