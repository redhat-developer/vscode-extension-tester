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

import { TextEditor, Menu, MenuItem, DebugConsoleView } from '../..';
import { error, Key, WebElement } from 'selenium-webdriver';

/**
 * Page object representing the content assistant
 */
export class ContentAssist extends Menu {
	constructor(parent: TextEditor | DebugConsoleView) {
		super(ContentAssist.locators.ContentAssist.constructor, parent);
	}

	/**
	 * Get content assist item by name/text, scroll through the list
	 * until the item is found, or the end is reached
	 *
	 * @param name name/text to search by
	 * @returns Promise resolving to ContentAssistItem object if found, undefined otherwise
	 */
	async getItem(name: string): Promise<ContentAssistItem | undefined> {
		let lastItem = false;
		const scrollable = await this.findElement(ContentAssist.locators.ContentAssist.itemList);

		let firstItem = await this.findElements(ContentAssist.locators.ContentAssist.firstItem);
		while (firstItem.length < 1) {
			await scrollable.sendKeys(Key.PAGE_UP, Key.NULL);
			firstItem = await this.findElements(ContentAssist.locators.ContentAssist.firstItem);
		}

		while (!lastItem) {
			const items = await this.getItems();

			for (const item of items) {
				if ((await item.getLabel()) === name) {
					return item;
				}
				lastItem = lastItem || (await item.getAttribute('data-last-element')) === 'true';
			}
			if (!lastItem) {
				await scrollable.sendKeys(Key.PAGE_DOWN);
				// Minimal delay for scroll to render new items
				await this.getWaitHelper().sleep(100);
			}
		}
	}

	/**
	 * Get all visible content assist items
	 * @returns Promise resolving to array of ContentAssistItem objects
	 */
	async getItems(): Promise<ContentAssistItem[]> {
		await this.getDriver().wait(async () => {
			return await this.isLoaded();
		});

		const elements = await this.findElement(ContentAssist.locators.ContentAssist.itemRows).findElements(ContentAssist.locators.ContentAssist.itemRow);
		const items: ContentAssistItem[] = [];

		for (const item of elements) {
			try {
				items.push(await new ContentAssistItem(item, this).wait());
			} catch (err) {
				if (!(err instanceof error.StaleElementReferenceError)) {
					throw err;
				}
			}
		}
		return items;
	}

	/**
	 * Find if the content assist is still loading the suggestions
	 * @returns promise that resolves to true when suggestions are done loading,
	 * to false otherwise
	 */
	async isLoaded(): Promise<boolean> {
		const message = await this.findElement(ContentAssist.locators.ContentAssist.message);
		if (await message.isDisplayed()) {
			if ((await message.getText()).startsWith('No suggestions')) {
				return true;
			}
			return false;
		}
		return true;
	}
}

/**
 * Page object for a content assist item
 */
export class ContentAssistItem extends MenuItem {
	constructor(item: WebElement, contentAssist: ContentAssist) {
		super(item, contentAssist);
		this.parent = contentAssist;
	}

	async getLabel(): Promise<string> {
		const labelDiv = await this.findElement(ContentAssist.locators.ContentAssist.itemLabel);
		return await labelDiv.getText();
	}
}
