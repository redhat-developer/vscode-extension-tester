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
	 * @param timeout overall time budget in ms for the search (default 30000)
	 * @returns Promise resolving to ContentAssistItem object if found, undefined otherwise
	 */
	async getItem(name: string, timeout: number = 30000): Promise<ContentAssistItem | undefined> {
		const deadline = Date.now() + timeout;
		const scrollable = await this.findElement(ContentAssist.locators.ContentAssist.itemList);

		await this.getDriver().wait(
			async () => {
				return (await this.isLoaded()) && (await this.findElements(ContentAssist.locators.ContentAssist.itemRow)).length > 0;
			},
			Math.min(10000, Math.max(1000, deadline - Date.now())),
			'Content assist item list did not populate',
		);

		// Scroll back to the top of the list in case it is not there already
		let firstItem = await this.findElements(ContentAssist.locators.ContentAssist.firstItem);
		while (firstItem.length < 1 && Date.now() < deadline) {
			await scrollable.sendKeys(Key.PAGE_UP, Key.NULL);
			await this.getWaitHelper().sleep(100);
			firstItem = await this.findElements(ContentAssist.locators.ContentAssist.firstItem);
		}

		while (Date.now() < deadline) {
			let rows: ContentAssistRowSnapshot[];
			try {
				rows = await this.snapshotVisibleRows();
			} catch (err) {
				if (err instanceof error.StaleElementReferenceError) {
					// The list re-rendered mid-read — take a fresh snapshot
					continue;
				}
				throw err;
			}
			const match = rows.find((row) => row.label === name);
			if (match) {
				try {
					return await new ContentAssistItem(match.element, this).wait();
				} catch (err) {
					if (err instanceof error.StaleElementReferenceError) {
						continue;
					}
					throw err;
				}
			}
			if (rows.some((row) => row.last)) {
				// Reached the end of the list without finding the item
				return undefined;
			}
			const maxIndex = rows.reduce((max, row) => Math.max(max, row.index), -1);
			await scrollable.sendKeys(Key.PAGE_DOWN);
			// Wait for the visible range to actually move instead of sleeping a fixed amount
			await this.getDriver()
				.wait(
					async () => {
						const next = await this.snapshotVisibleRows().catch(() => undefined);
						return next !== undefined && (next.some((row) => row.last) || next.reduce((max, row) => Math.max(max, row.index), -1) > maxIndex);
					},
					Math.min(2000, Math.max(200, deadline - Date.now())),
				)
				.catch(() => {
					// The list did not move — keep looping, the deadline will end the search
				});
		}
		return undefined;
	}

	/**
	 * Read all currently rendered suggestion rows in a single script call.
	 * Returns the row elements together with their label text, virtual list index
	 * and whether the row is marked as the last element of the list.
	 */
	private async snapshotVisibleRows(): Promise<ContentAssistRowSnapshot[]> {
		const container = await this.findElement(ContentAssist.locators.ContentAssist.itemRows);
		const rowLocator = ContentAssist.locators.ContentAssist.itemRow as unknown as SerializableLocator;
		const labelLocator = ContentAssist.locators.ContentAssist.itemLabel as unknown as SerializableLocator;
		const raw = (await this.getDriver().executeScript(
			ContentAssist.SNAPSHOT_ROWS_SCRIPT,
			container,
			rowLocator.using,
			rowLocator.value,
			labelLocator.using,
			labelLocator.value,
		)) as { element: WebElement; label: string; index: number; last: boolean }[];
		return raw.map((row) => ({ element: row.element, label: row.label, index: row.index, last: row.last }));
	}

	private static readonly SNAPSHOT_ROWS_SCRIPT = `
		var container = arguments[0];
		var rowUsing = arguments[1], rowValue = arguments[2];
		var labelUsing = arguments[3], labelValue = arguments[4];
		function findAll(root, using, value) {
			if (using === 'xpath') {
				var out = [];
				var it = document.evaluate(value, root, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
				for (var i = 0; i < it.snapshotLength; i++) { out.push(it.snapshotItem(i)); }
				return out;
			}
			return Array.prototype.slice.call(root.querySelectorAll(value));
		}
		function findOne(root, using, value) {
			if (using === 'xpath') {
				return document.evaluate(value, root, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
			}
			return root.querySelector(value);
		}
		return findAll(container, rowUsing, rowValue).map(function (row) {
			var labelEl = findOne(row, labelUsing, labelValue);
			var label = labelEl ? (labelEl.innerText !== undefined ? labelEl.innerText : labelEl.textContent) : '';
			return {
				element: row,
				label: (label || '').trim(),
				index: parseInt(row.getAttribute('data-index') || '-1', 10),
				last: row.getAttribute('data-last-element') === 'true'
			};
		});
	`;

	/**
	 * Get all visible content assist items
	 * @returns Promise resolving to array of ContentAssistItem objects
	 */
	async getItems(): Promise<ContentAssistItem[]> {
		await this.getDriver().wait(async () => {
			return await this.isLoaded();
		}, 10000);

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
		const messages = await this.findElements(ContentAssist.locators.ContentAssist.message);
		if (messages.length === 0) {
			return true;
		}
		if (await messages[0].isDisplayed()) {
			const text = await messages[0].getText();
			// Empty message means loaded; "No suggestions" is also a terminal state.
			// Any other non-empty text (e.g. "Loading...") means still loading.
			return text === '' || text.startsWith('No suggestions');
		}
		return true;
	}
}

interface SerializableLocator {
	using: string;
	value: string;
}

interface ContentAssistRowSnapshot {
	element: WebElement;
	label: string;
	index: number;
	last: boolean;
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
