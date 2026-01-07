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

import { Key } from 'selenium-webdriver';
import { WindowControls, ContextMenu } from '../..';
import { Menu } from './Menu';
import { MenuItem } from './MenuItem';

/**
 * Page object representing the custom VS Code title bar
 */
export class TitleBar extends Menu {
	constructor() {
		super(TitleBar.locators.TitleBar.constructor, TitleBar.locators.Workbench.constructor);
	}

	/**
	 * Get title bar item by name
	 * @param name name of the item to search by
	 * @returns Promise resolving to TitleBarItem object
	 */
	async getItem(name: string): Promise<TitleBarItem | undefined> {
		try {
			await this.findElement(TitleBar.locators.TitleBar.itemConstructor(name));
			return await new TitleBarItem(name, this).wait();
		} catch (err) {
			return undefined;
		}
	}

	/**
	 * Get all title bar items
	 * @returns Promise resolving to array of TitleBarItem objects
	 */
	async getItems(): Promise<TitleBarItem[]> {
		const items: TitleBarItem[] = [];
		const elements = await this.findElements(TitleBar.locators.TitleBar.itemElement);

		for (const element of elements) {
			try {
				if (await element.isDisplayed()) {
					items.push(await new TitleBarItem(await element.getAttribute(TitleBar.locators.TitleBar.itemLabel), this).wait());
				}
			} catch (e: any) {
				if (e.name === 'StaleElementReferenceError') {
					continue;
				}
				throw e;
			}
		}
		return items;
	}

	/**
	 * Get the window title
	 * @returns Promise resolving to the window title
	 */
	async getTitle(): Promise<string> {
		return await this.findElement(TitleBar.locators.TitleBar.title).getText();
	}

	/**
	 * Get a reference to the WindowControls
	 * @deprecated Window Control is no more available in a DOM of Visual Studio Code
	 */
	getWindowControls(): WindowControls {
		return new WindowControls(this);
	}
}

/**
 * Page object representing an item of the custom VS Code title bar
 */
export class TitleBarItem extends MenuItem {
	constructor(label: string, parent: Menu) {
		super(TitleBar.locators.TitleBar.itemConstructor(label), parent);
		this.parent = parent;
		this.label = label;
	}

	async select(): Promise<ContextMenu> {
		const openMenus = await this.getDriver().findElements(TitleBar.locators.ContextMenu.constructor);
		if (openMenus.length > 0 && (await openMenus[0].isDisplayed())) {
			await this.getDriver().actions().sendKeys(Key.ESCAPE).perform();
		}
		await this.click();
		// Wait for context menu to appear
		await this.getWaitHelper().forCondition(
			async () => {
				const menus = await this.getDriver().findElements(TitleBar.locators.ContextMenu.constructor);
				return menus.length > 0 && (await menus[0].isDisplayed());
			},
			{ timeout: 2000, pollInterval: 50 },
		);
		return new ContextMenu(this).wait();
	}
}
