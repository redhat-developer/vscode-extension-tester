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

import { WebElement } from 'selenium-webdriver';
import { TreeSection } from '../TreeSection.js';
import { CustomTreeItem } from '../custom/CustomTreeItem.js';

export class WatchSectionItem extends CustomTreeItem {
	constructor(element: WebElement, viewPart: TreeSection) {
		super(element, viewPart);
	}

	/**
	 * Get label of the Watch section item.
	 * @returns a promise resolving to Watch section item label string
	 */
	async getLabel(): Promise<string> {
		const name = await this.findElement(WatchSectionItem.locators.WatchSectionItem.label);
		return await name?.getAttribute('textContent');
	}

	/**
	 * Get value of the Watch section item.
	 * @returns a promise resolving to Watch section value label string
	 */
	async getValue(): Promise<string> {
		const value = await this.findElement(WatchSectionItem.locators.WatchSectionItem.value);
		return await value.getText();
	}

	/**
	 * Remove item from Watch section.
	 */
	async remove(): Promise<void> {
		const button = await this.getActionButton(WatchSectionItem.locators.WatchSectionItem.remove);
		await button?.click();
	}
}
