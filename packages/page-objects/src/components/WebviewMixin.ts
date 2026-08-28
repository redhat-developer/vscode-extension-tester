/**
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License", destination); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Locator, WebElement, error } from 'selenium-webdriver';
import { AbstractElement } from './AbstractElement';

/**
 * Heavily inspired by https://stackoverflow.com/a/65418734
 */

type Constructor<T = object> = new (...args: any[]) => T;

/**
 * The interface that a class is required to have in order to use the Webview mixin.
 */
interface WebviewMixable extends AbstractElement {
	getViewToSwitchTo(): Promise<WebElement | undefined>;
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
export default function <TBase extends Constructor<WebviewMixable>>(Base: TBase): Constructor<InstanceType<TBase> & WebviewMixinType> {
	return class extends Base implements WebviewMixinType {
		/**
		 * Window handle captured once at switchToFrame() time so that switchBack()
		 * always returns to the correct top-level context even when called from
		 * within a nested frame.
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
		 *
		 * The method polls for both the outer iframe and the inner active-frame to
		 * appear in the DOM under a single shared deadline, so `timeout` is always
		 * honoured regardless of how long each phase takes.  The driver is always
		 * returned to the top-level context before any error is thrown.
		 *
		 * @throws Error when the webview iframe cannot be located within the timeout
		 */
		async switchToFrame(timeout: number = 5000): Promise<void> {
			if (!this.handle) {
				this.handle = await this.getDriver().getWindowHandle();
			}

			const deadline = Date.now() + timeout;
			const pollInterval = 200;
			const minPhase2Budget = Math.min(5000, Math.floor(timeout / 3));

			// Phase 1 — poll for the outer webview iframe. Stop early to
			// guarantee at least minPhase2Budget ms for the inner-frame lookup.
			let view: WebElement | undefined;
			while (Date.now() < deadline - minPhase2Budget) {
				try {
					view = await this.getViewToSwitchTo();
				} catch (e) {
					if (!(e instanceof error.StaleElementReferenceError || e instanceof error.NoSuchElementError)) {
						throw e;
					}
				}
				if (view) {
					break;
				}
				await this.getDriver().sleep(pollInterval);
			}

			if (!view) {
				throw new Error(
					`WebviewMixin.switchToFrame: webview iframe was not found within ${timeout}ms. ` +
						`The webview may not have been opened, or the locator no longer matches the current VS Code version. ` +
						`See https://github.com/redhat-developer/vscode-extension-tester/issues/2450`,
				);
			}

			// Phase 2 — switch into the outer iframe, then poll for the inner
			// active-frame under the remaining budget (at least minPhase2Budget ms).
			try {
				await this.getDriver().switchTo().frame(view);
			} catch (e) {
				if (e instanceof error.StaleElementReferenceError) {
					throw new Error(
						`WebviewMixin.switchToFrame: outer iframe became stale during frame switch. ` +
							`See https://github.com/redhat-developer/vscode-extension-tester/issues/2450`,
					);
				}
				throw e;
			}

			let frame: WebElement | undefined;
			while (Date.now() < deadline) {
				try {
					const frames = await this.getDriver().findElements(AbstractElement.locators.WebView.activeFrame);
					if (frames.length > 0) {
						frame = frames[0];
						break;
					}
				} catch (e) {
					if (!(e instanceof error.StaleElementReferenceError || e instanceof error.NoSuchElementError)) {
						await this.getDriver().switchTo().window(this.handle);
						throw e;
					}
				}
				await this.getDriver().sleep(pollInterval);
			}

			if (!frame) {
				// Return to top-level before throwing so callers are not left inside a frame.
				await this.getDriver().switchTo().window(this.handle);
				throw new Error(
					`WebviewMixin.switchToFrame: active-frame iframe was not found within ${timeout}ms. ` +
						`The webview content may still be loading. ` +
						`See https://github.com/redhat-developer/vscode-extension-tester/issues/2450`,
				);
			}

			await this.getDriver().switchTo().frame(frame);
		}

		/**
		 * Switch the underlying webdriver back to the original window.
		 * Uses the handle captured at switchToFrame() time; safe to call even when
		 * the driver context is already at the top level.
		 */
		async switchBack(): Promise<void> {
			if (!this.handle) {
				// switchToFrame() was never called — capture and stay at top level
				this.handle = await this.getDriver().getWindowHandle();
			}
			return await this.getDriver().switchTo().window(this.handle);
		}
	} as unknown as Constructor<InstanceType<TBase> & WebviewMixinType>;
}
