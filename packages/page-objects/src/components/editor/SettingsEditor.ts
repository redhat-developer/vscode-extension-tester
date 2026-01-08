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

import { Editor } from './Editor';
import { ContextMenu } from '../menu/ContextMenu';
import { WebElement, Key, By } from 'selenium-webdriver';
import { AbstractElement } from '../AbstractElement';
import { EditorView, EditorGroup, Workbench } from '../..';
import { satisfies } from 'compare-versions';

/**
 * Page object representing the internal VS Code settings editor
 */
export class SettingsEditor extends Editor {
	private divider = satisfies(SettingsEditor.versionInfo.version, '>=1.83.0') ? '›' : ' › ';

	constructor(view: EditorView | EditorGroup = new EditorView()) {
		super(view);
	}

	protected async reinitialize(): Promise<this> {
		const reopened = await new Workbench().openSettings();
		// Check if we got the same type back
		if (!(reopened instanceof (this.constructor as any))) {
			throw new Error(`Reopened editor is not the same type as original.`);
		}
		return reopened as this;
	}

	/**
	 * Search for a setting with a particular title and category.
	 * Returns an appropriate Setting object if the label is found,
	 * undefined otherwise.
	 *
	 * If your setting has nested categories (i.e `example.general.test`),
	 * pass in each category as a separate string.
	 *
	 * @param title title of the setting
	 * @param categories category of the setting
	 * @returns Promise resolving to a Setting object if found, undefined otherwise
	 */
	async findSetting(title: string, ...categories: string[]): Promise<Setting> {
		return this.withRecovery(async (self) => {
			const category = categories.join(self.divider);
			const searchBox = await self.findElement(SettingsEditor.locators.Editor.inputArea);
			await searchBox.sendKeys(Key.chord(SettingsEditor.ctlKey, 'a'));
			await searchBox.sendKeys(`${category}>${title}`);

			return await self._getSettingItem(title, category);
		});
	}

	/**
	 * Search for a setting with a precise ID.
	 * Returns an appropriate Setting object if it exists,
	 * undefined otherwise.
	 *
	 * @param id of the setting
	 * @returns Promise resolving to a Setting object if found, undefined otherwise
	 */
	async findSettingByID(id: string): Promise<Setting> {
		const searchBox = await this.findElement(SettingsEditor.locators.Editor.inputArea);
		await searchBox.sendKeys(Key.chord(SettingsEditor.ctlKey, 'a'));
		await searchBox.sendKeys(id);

		const title = id.split('.').pop();
		return await this._getSettingItem(title);
	}

	private async _getSettingItem(title: string = '', category: string = ''): Promise<Setting> {
		const count = await this.findElement(SettingsEditor.locators.SettingsEditor.itemCount);
		// Wait for settings count to stabilize (loading complete)
		await this.getWaitHelper().forCountStable(
			async () => {
				const text = await count.getText();
				const match = new RegExp(/\d+/).exec(text);
				return match ? Number.parseInt(match[0], 10) : 0;
			},
			{ timeout: 5000, stabilityInterval: 300, stableChecks: 2 },
		);

		let setting!: Setting;
		const items = await this.findElements(SettingsEditor.locators.SettingsEditor.itemRow);
		for (const item of items) {
			try {
				const itemCategory = (await (await item.findElement(SettingsEditor.locators.SettingsEditor.settingCategory)).getText()).replace(':', '');
				const itemTitle = await (await item.findElement(SettingsEditor.locators.SettingsEditor.settingLabel)).getText();
				if (category !== '') {
					if (
						category.toLowerCase().replace(this.divider, '').replace(/\s/g, '').trim() !==
						itemCategory.toLowerCase().replace(this.divider, '').replace(/\s/g, '').trim()
					) {
						continue;
					}
				}
				if (title !== '') {
					if (title.toLowerCase().replace(/\s/g, '').trim() !== itemTitle.toLowerCase().replace(/\s/g, '').trim()) {
						continue;
					}
				}
				return await (await this.createSetting(item, itemTitle, itemCategory)).wait();
			} catch (err) {
				// do nothing
			}
		}
		return setting;
	}

	/**
	 * Switch between settings perspectives
	 * Works only if your vscode instance has both user and workspace settings available
	 *
	 * @param perspective User or Workspace
	 * @returns Promise that resolves when the appropriate button is clicked
	 */
	async switchToPerspective(perspective: 'User' | 'Workspace'): Promise<void> {
		const actions = await this.findElement(SettingsEditor.locators.SettingsEditor.header)
			.findElement(SettingsEditor.locators.SettingsEditor.tabs)
			.findElement(SettingsEditor.locators.SettingsEditor.actions);
		await actions.findElement(SettingsEditor.locators.SettingsEditor.action(perspective)).click();
	}

	/**
	 * Context menu is disabled in this editor, throw an error
	 */
	async openContextMenu(): Promise<ContextMenu> {
		throw new Error('Operation not supported!');
	}

	private async createSetting(element: WebElement, title: string, category: string): Promise<Setting> {
		await element.findElement(SettingsEditor.locators.SettingsEditor.settingConstructor(title, category));
		try {
			// try a combo setting
			await element.findElement(SettingsEditor.locators.SettingsEditor.comboSetting);
			return new ComboSetting(SettingsEditor.locators.SettingsEditor.settingConstructor(title, category), this);
		} catch (err) {
			try {
				// try text setting
				await element.findElement(SettingsEditor.locators.SettingsEditor.textSetting);
				return new TextSetting(SettingsEditor.locators.SettingsEditor.settingConstructor(title, category), this);
			} catch (err) {
				try {
					// try checkbox setting
					await element.findElement(SettingsEditor.locators.SettingsEditor.checkboxSetting);
					return new CheckboxSetting(SettingsEditor.locators.SettingsEditor.settingConstructor(title, category), this);
				} catch (err) {
					// try link setting
					try {
						await element.findElement(SettingsEditor.locators.SettingsEditor.linkButton);
						return new LinkSetting(SettingsEditor.locators.SettingsEditor.settingConstructor(title, category), this);
					} catch (err) {
						// try array setting
						try {
							await element.findElement(SettingsEditor.locators.SettingsEditor.arraySetting);
							return new ArraySetting(SettingsEditor.locators.SettingsEditor.settingConstructor(title, category), this);
						} catch (err) {
							throw new Error('Setting type not supported!');
						}
					}
				}
			}
		}
	}
}

/**
 * Abstract item representing a Setting with title, description and
 * an input element (combo/textbox/checkbox/link/array)
 */
export abstract class Setting extends AbstractElement {
	constructor(settingsConstructor: By, settings: SettingsEditor) {
		super(settingsConstructor, settings);
	}

	/**
	 * Get the value of the setting based on its input type
	 *
	 * @returns promise that resolves to the current value of the setting
	 */
	abstract getValue(): Promise<string | boolean>;

	/**
	 * Set the value of the setting based on its input type
	 *
	 * @param value boolean for checkboxes, string otherwise
	 */
	abstract setValue(value: string | boolean): Promise<void>;

	/**
	 * Get the category of the setting
	 * All settings are labeled as Category: Title
	 */
	async getCategory(): Promise<string> {
		return await (await this.findElement(SettingsEditor.locators.SettingsEditor.settingCategory)).getText();
	}

	/**
	 * Get description of the setting
	 * @returns Promise resolving to setting description
	 */
	async getDescription(): Promise<string> {
		return await (await this.findElement(SettingsEditor.locators.SettingsEditor.settingDescription)).getText();
	}

	/**
	 * Get title of the setting
	 */
	async getTitle(): Promise<string> {
		return await (await this.findElement(SettingsEditor.locators.SettingsEditor.settingLabel)).getText();
	}
}

/**
 * Setting with a combo box
 */
export class ComboSetting extends Setting {
	async getValue(): Promise<string> {
		const combo = await this.findElement(SettingsEditor.locators.SettingsEditor.comboSetting);
		return await combo.getAttribute(SettingsEditor.locators.SettingsEditor.comboValue);
	}

	async setValue(value: string): Promise<void> {
		const rows = await this.getOptions();
		for (const row of rows) {
			try {
				if ((await row.getAttribute('class')).indexOf('disabled') < 0) {
					const text = await row.getAttribute(SettingsEditor.locators.SettingsEditor.comboValue);
					if (value === text) {
						return await row.click();
					}
				}
			} catch (e: any) {
				if (e.name === 'StaleElementReferenceError') {
					continue;
				}
				throw e;
			}
		}
	}

	/**
	 * Get the labels of all options from the combo
	 * @returns Promise resolving to array of string values
	 */
	async getValues(): Promise<string[]> {
		const values: string[] = [];
		const rows = await this.getOptions();
		for (const row of rows) {
			try {
				values.push(await row.getAttribute(SettingsEditor.locators.SettingsEditor.comboValue));
			} catch (e: any) {
				if (e.name === 'StaleElementReferenceError') {
					continue;
				}
				throw e;
			}
		}
		return values;
	}

	private async getOptions(): Promise<WebElement[]> {
		const combo = await this.findElement(SettingsEditor.locators.SettingsEditor.comboSetting);
		return await combo.findElements(SettingsEditor.locators.SettingsEditor.comboOption);
	}
}

/**
 * Setting with a text box input
 */
export class TextSetting extends Setting {
	async getValue(): Promise<string> {
		const input = await this.findElement(SettingsEditor.locators.SettingsEditor.textSetting);
		return await input.getAttribute('value');
	}

	async setValue(value: string): Promise<void> {
		const input = await this.findElement(SettingsEditor.locators.SettingsEditor.textSetting);
		await input.clear();
		await input.sendKeys(value);
	}
}

/**
 * Setting with a checkbox
 */
export class CheckboxSetting extends Setting {
	async getValue(): Promise<boolean> {
		const checkbox = await this.findElement(SettingsEditor.locators.SettingsEditor.checkboxSetting);
		const checked = await checkbox.getAttribute(SettingsEditor.locators.SettingsEditor.checkboxChecked);
		if (checked === 'true') {
			return true;
		}
		return false;
	}

	async setValue(value: boolean): Promise<void> {
		const checkbox = await this.findElement(SettingsEditor.locators.SettingsEditor.checkboxSetting);
		if ((await this.getValue()) !== value) {
			await checkbox.click();
		}
	}
}

/**
 * Setting with no value, with a link to settings.json instead
 */
export class LinkSetting extends Setting {
	async getValue(): Promise<string> {
		throw new Error('Method getValue is not available for LinkSetting!');
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async setValue(value: string | boolean): Promise<void> {
		throw new Error('Method setValue is not available for LinkSetting!');
	}

	/**
	 * Open the link that leads to the value in settings.json
	 * @returns Promise resolving when the link has been clicked
	 */
	async openLink(): Promise<void> {
		const link = await this.findElement(SettingsEditor.locators.SettingsEditor.linkButton);
		await link.click();
	}
}

/**
 * Setting with an array of string values (rows)
 */
export class ArraySetting extends Setting {
	/**
	 * @deprecated Method 'getValue' is not available for ArraySetting!
	 */
	async getValue(): Promise<string | boolean> {
		throw new Error("Method 'getValue' is not available for ArraySetting!");
	}

	/**
	 * @deprecated Method 'setValue' is not available for ArraySetting!
	 */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async setValue(value: string | boolean): Promise<void> {
		throw new Error("Method 'setValue' is not available for ArraySetting!");
	}

	/**
	 * Select a row of a setting array of string values
	 * @param item label | index
	 */
	async select(item: string | number): Promise<void> {
		const toSelect = await this.getItem(item);
		await toSelect?.select();
	}

	/**
	 * Get a row as new ArraySettingItem object
	 * @param item label or index
	 * @returns ArraySettingItem | undefined
	 */
	async getItem(item: string | number): Promise<ArraySettingItem | undefined> {
		const row = await this.findRow(item);
		if (row) {
			return new ArraySettingItem(row, this);
		}
		return undefined;
	}

	/**
	 * Get a list of all rows as ArraySettingItem objects
	 * @returns ArraySettingItem[]
	 */
	async getItems(): Promise<ArraySettingItem[]> {
		const listRows = await this.getRows();
		const items: ArraySettingItem[] = [];
		for (const row of listRows) {
			items.push(new ArraySettingItem(row, this));
		}
		return items;
	}

	/**
	 * Get a list of all rows values
	 * @returns string[]
	 */
	async getValues(): Promise<string[]> {
		const values: string[] = [];
		const listRows = await this.getRows();
		for (const row of listRows) {
			try {
				const li = await row.findElement(SettingsEditor.locators.SettingsEditor.arrayRowValue);
				values.push(await li.getText());
			} catch (e: any) {
				if (e.name === 'StaleElementReferenceError') {
					// Item became stale during iteration (DOM updating), skip it
					// The caller's retry logic will handle getting a consistent view
					continue;
				}
				throw e;
			}
		}
		return values;
	}

	/**
	 * Click 'Add Item' and get row as ArraySettingItem in edit mode
	 * @returns ArraySettingItem
	 */
	async add(): Promise<ArraySettingItem> {
		// click 'Add Item' button
		const button = await this.findElement(SettingsEditor.locators.SettingsEditor.arrayNewRow).findElement(SettingsEditor.locators.SettingsEditor.button);
		await button.click();

		// Wait for edit row to appear in DOM
		const list = await this.getListRootElement();
		await this.getWaitHelper().forCondition(
			async () => {
				const rows = await list.findElements(SettingsEditor.locators.SettingsEditor.arrayEditRow);
				return rows.length > 0;
			},
			{ timeout: 2000, message: 'Edit row did not appear after clicking Add Item' },
		);

		// get item row switched to 'edit' mode
		const editRow = await list.findElement(SettingsEditor.locators.SettingsEditor.arrayEditRow);
		return new ArraySettingItem(editRow, this);
	}

	/**
	 * Select a row, then click 'Edit Item' and get row as ArraySettingItem in edit mode
	 * @param item label | index
	 * @returns ArraySettingItem | undefined
	 */
	async edit(item: string | number): Promise<ArraySettingItem | undefined> {
		const row = await this.findRow(item);
		if (row) {
			// select item row
			const toEdit = new ArraySettingItem(row, this);
			await toEdit.select();

			// click 'Edit Item' button
			const edit = await toEdit.findElement(SettingsEditor.locators.SettingsEditor.arrayBtnConstructor('Edit Item'));
			await edit.click();

			// Wait for edit row to appear in DOM
			const list = await this.getListRootElement();
			await this.getWaitHelper().forCondition(
				async () => {
					const rows = await list.findElements(SettingsEditor.locators.SettingsEditor.arrayEditRow);
					return rows.length > 0;
				},
				{ timeout: 2000, message: 'Edit row did not appear after clicking Edit Item' },
			);

			// get item row switched to 'edit' mode
			const editRow = await list.findElement(SettingsEditor.locators.SettingsEditor.arrayEditRow);
			return new ArraySettingItem(editRow, this);
		}
		return undefined;
	}

	private async getListRootElement(): Promise<WebElement> {
		return await this.findElement(SettingsEditor.locators.SettingsEditor.arrayRoot);
	}

	private async getRows(): Promise<WebElement[]> {
		const list = await this.getListRootElement();
		return await list.findElements(SettingsEditor.locators.SettingsEditor.arrayRow);
	}

	private async findRow(item: string | number): Promise<WebElement | undefined> {
		const listRows = await this.getRows();
		if (Number.isInteger(item)) {
			const index = +item;
			if (index < 0 || index > listRows.length - 1) {
				throw Error(`Index '${index}' is of bounds! Found items have length = ${listRows.length}.`);
			}
			return listRows[index];
		} else {
			for (const row of listRows) {
				try {
					const li = await row.findElement(SettingsEditor.locators.SettingsEditor.arrayRowValue);
					if ((await li.getText()) === item) {
						return row;
					}
				} catch (e: any) {
					if (e.name === 'StaleElementReferenceError') {
						continue;
					}
					throw e;
				}
			}
		}
		return undefined;
	}
}

/**
 * Represents each row of an ArraySetting array of strings
 */
export class ArraySettingItem extends AbstractElement {
	constructor(element: WebElement, setting: ArraySetting) {
		super(element, setting);
	}

	/**
	 * Select an item
	 */
	async select(): Promise<void> {
		await this.click();
		// Wait for selection state to be applied
		await this.getWaitHelper().forCondition(
			async () => {
				const classAttr = await this.getAttribute('class');
				return classAttr && (classAttr.includes('selected') || classAttr.includes('focused'));
			},
			{ timeout: 1000, pollInterval: 50 },
		);
	}

	/**
	 * Get item text value
	 * @returns string
	 */
	async getValue(): Promise<string> {
		return await this.getText();
	}

	/**
	 * Set item text value
	 * @param value string
	 */
	async setValue(value: string): Promise<void> {
		const input = await this.findElement(SettingsEditor.locators.SettingsEditor.textSetting);
		await input.clear();
		await input.sendKeys(value);
	}

	/**
	 * Click 'Remove Item' button
	 */
	async remove(): Promise<void> {
		await this.select();
		const remove = await this.findElement(SettingsEditor.locators.SettingsEditor.arrayBtnConstructor('Remove Item'));
		await remove.click();
		// Wait for item to be removed from DOM
		await this.getWaitHelper().forCondition(
			async () => {
				try {
					await this.isDisplayed();
					return false;
				} catch {
					return true; // Element no longer exists
				}
			},
			{ timeout: 1000, pollInterval: 50 },
		);
	}

	/**
	 * Click 'OK' button
	 * @description Only when the item is in edit mode
	 */
	async ok(): Promise<void> {
		const ok = await this.findElement(SettingsEditor.locators.SettingsEditor.arraySettingItem.btnConstructor('OK'));
		await ok.click();
		// Wait for edit mode to close - the edit row will be removed from DOM
		await this.getWaitHelper()
			.forCondition(
				async () => {
					try {
						await this.isDisplayed();
						// Check if still in edit mode by looking for OK button
						const okButtons = await this.findElements(SettingsEditor.locators.SettingsEditor.arraySettingItem.btnConstructor('OK'));
						return okButtons.length === 0;
					} catch {
						return true; // Element removed from DOM
					}
				},
				{ timeout: 2000, pollInterval: 100 },
			)
			.catch(() => {
				/* Element may already be gone */
			});
	}

	/**
	 * Click 'Cancel' button
	 * @description Only when the item is in edit mode
	 */
	async cancel(): Promise<void> {
		const cancel = await this.findElement(SettingsEditor.locators.SettingsEditor.arraySettingItem.btnConstructor('Cancel'));
		await cancel.click();
		// Wait for edit mode to close - the edit row will be removed from DOM
		await this.getWaitHelper()
			.forCondition(
				async () => {
					try {
						await this.isDisplayed();
						// Check if still in edit mode by looking for Cancel button
						const cancelButtons = await this.findElements(SettingsEditor.locators.SettingsEditor.arraySettingItem.btnConstructor('Cancel'));
						return cancelButtons.length === 0;
					} catch {
						return true; // Element removed from DOM
					}
				},
				{ timeout: 2000, pollInterval: 100 },
			)
			.catch(() => {
				/* Element may already be gone */
			});
	}
}
