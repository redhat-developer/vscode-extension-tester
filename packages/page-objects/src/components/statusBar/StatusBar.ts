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
import { AbstractElement } from '../AbstractElement';
import { NotificationsCenter } from '../workbench/NotificationsCenter';

/**
 * Page object for the status bar at the bottom
 */
export class StatusBar extends AbstractElement {
	constructor() {
		super(StatusBar.locators.StatusBar.constructor, StatusBar.locators.Workbench.constructor);
	}

	/**
	 * Retrieve all status bar items currently displayed
	 * @returns Promise resolving to an array of WebElement
	 */
	async getItems(): Promise<WebElement[]> {
		return await this.findElements(StatusBar.locators.StatusBar.item);
	}

	/**
	 * Find status bar item by title/visible label
	 * @param title title of the item
	 * @returns Promise resolving to a WebElement if item is found, to undefined otherwise
	 */
	async getItem(title: string): Promise<WebElement | undefined> {
		const items = await this.getItems();
		for (const item of items) {
			try {
				if ((await item.getAttribute(StatusBar.locators.StatusBar.itemTitle)) === title) {
					return item;
				}
			} catch (err) {
				if (!(err instanceof error.StaleElementReferenceError)) {
					throw err;
				}
			}
		}
		return undefined;
	}

	/**
	 * Open the notifications center
	 * @returns Promise resolving to NotificationsCenter object
	 */
	async openNotificationsCenter(): Promise<NotificationsCenter> {
		await this.toggleNotificationsCentre(true);
		return new NotificationsCenter();
	}

	/**
	 * Close the notifications center
	 * @returns Promise resolving when the notifications center is closed
	 */
	async closeNotificationsCenter(): Promise<void> {
		await this.toggleNotificationsCentre(false);
	}

	/**
	 * Open the language selection quick pick
	 * Only works with an open editor
	 * @returns Promise resolving when the language selection is opened
	 */
	async openLanguageSelection(): Promise<void> {
		await (await this.findPart(StatusBar.locators.StatusBar.language)).click();
	}

	/**
	 * Get the current language label text
	 * Only works with an open editor
	 * @returns Promise resolving to string representation of current language
	 */
	async getCurrentLanguage(): Promise<string> {
		return await this.getPartText(StatusBar.locators.StatusBar.language);
	}

	/**
	 * Open the quick pick for line endings selection
	 * Only works with an open editor
	 * @returns Promise resolving when the line ending selection is opened
	 */
	async openLineEndingSelection(): Promise<void> {
		await (await this.findPart(StatusBar.locators.StatusBar.lines)).click();
	}

	/**
	 * Get the currently selected line ending as text
	 * Only works with an open editor
	 * @returns Promise resolving to string representation of current line ending
	 */
	async getCurrentLineEnding(): Promise<string> {
		return await this.getPartText(StatusBar.locators.StatusBar.lines);
	}

	/**
	 * Open the encoding selection quick pick
	 * Only works with an open editor
	 * @returns Promise resolving when the encoding selection is opened
	 */
	async openEncodingSelection(): Promise<void> {
		await (await this.findPart(StatusBar.locators.StatusBar.encoding)).click();
	}

	/**
	 * Get the name of the current encoding as text
	 * Only works with an open editor
	 * @returns Promise resolving to string representation of current encoding
	 */
	async getCurrentEncoding(): Promise<string> {
		return await this.getPartText(StatusBar.locators.StatusBar.encoding);
	}

	/**
	 * Open the indentation selection quick pick
	 * Only works with an open editor
	 * @returns Promise resolving when the indentation selection is opened
	 */
	async openIndentationSelection(): Promise<void> {
		await (await this.findPart(StatusBar.locators.StatusBar.indent)).click();
	}

	/**
	 * Get the current indentation option label as text
	 * Only works with an open editor
	 * @returns Promise resolving to string representation of current indentation
	 */
	async getCurrentIndentation(): Promise<string> {
		return await this.getPartText(StatusBar.locators.StatusBar.indent);
	}

	/**
	 * Open the line selection input box
	 * Only works with an open editor
	 * @returns Promise resolving when the line selection is opened
	 */
	async openLineSelection(): Promise<void> {
		await (await this.findPart(StatusBar.locators.StatusBar.selection)).click();
	}

	/**
	 * Get the current editor coordinates as text
	 * Only works with an open editor
	 * @returns Promise resolving to string representation of current position in the editor
	 */
	async getCurrentPosition(): Promise<string> {
		return await this.getPartText(StatusBar.locators.StatusBar.selection);
	}

	/**
	 * Open/Close notification centre
	 * @param open true to open, false to close
	 */
	private async toggleNotificationsCentre(open: boolean, attemptsLeft: number = 3): Promise<void> {
		if ((await this.isNotificationsCentreVisible()) !== open) {
			await this.findElement(StatusBar.locators.StatusBar.bell).click();
		}
		// The click can get lost while the workbench is still moving focus (e.g. into an editor
		// that has just opened), so check the result and click the bell again if needed.
		try {
			await this.getWaitHelper().forCondition(async () => (await this.isNotificationsCentreVisible()) === open, {
				timeout: 3000,
				pollInterval: 100,
			});
		} catch {
			if (attemptsLeft > 1) {
				await this.toggleNotificationsCentre(open, attemptsLeft - 1);
			} else if (open) {
				// do not hand out a NotificationsCenter that is closed: its notifications would read as empty
				throw new Error('Notifications center did not open');
			}
		}
	}

	private async isNotificationsCentreVisible(): Promise<boolean> {
		try {
			const klass = (await this.enclosingItem.findElement(StatusBar.locators.StatusBar.notifications).getAttribute('class'))!;
			return klass.includes('visible');
		} catch (err) {
			if (err instanceof error.NoSuchElementError) {
				// element doesn't exist until the button is first clicked
				return false;
			}
			throw err;
		}
	}

	private async getPartText(locator: Locator): Promise<string> {
		return (await (await this.findPart(locator)).findElement(StatusBar.locators.StatusBar.aTag).getAttribute('innerHTML'))!;
	}

	/**
	 * Find an item of the status bar. The editor items (language, encoding, position, ...) are added
	 * after the editor opens, on a later animation frame, so wait for them instead of failing at once.
	 * An item that does not appear fails with a `NoSuchElementError`, as a plain lookup does.
	 */
	private async findPart(locator: Locator, timeout: number = 5_000): Promise<WebElement> {
		try {
			return await this.getDriver().wait(async () => (await this.findElements(locator))[0], timeout);
		} catch (e) {
			if (e instanceof error.TimeoutError) {
				throw new error.NoSuchElementError(`Status bar item did not appear within ${timeout} ms`);
			}
			throw e;
		}
	}
}
