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

import { AbstractElement } from '../AbstractElement';
import { Menu } from './Menu';

/**
 * Abstract element representing a menu item
 */
export abstract class MenuItem extends AbstractElement {
	protected parent!: Menu;
	protected label!: string;

	/**
	 * Use the given menu item: Opens the submenu if the item has children,
	 * otherwise simply click the item.
	 *
	 * @returns Menu object representing the submenu if the item has children, void otherwise.
	 */
	async select(): Promise<Menu | undefined> {
		await this.click();
		// Wait for click action to complete - menu may close after selection
		await this.getWaitHelper()
			.forCondition(
				async () => {
					try {
						// Check if element is still visible (menu might close)
						return !(await this.isDisplayed());
					} catch {
						return true; // Element removed from DOM
					}
				},
				{ timeout: 1000, pollInterval: 50 },
			)
			.catch(() => {
				/* Menu item may still be visible if it has submenu */
			});
		return undefined;
	}

	/**
	 * Return the Menu object representing the menu this item belongs to
	 */
	getParent(): Menu {
		return this.parent;
	}

	/**
	 * Returns the label of the menu item
	 */
	getLabel(): string | Promise<string> {
		return this.label;
	}
}
