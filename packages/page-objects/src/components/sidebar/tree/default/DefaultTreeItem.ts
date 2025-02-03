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

import { TreeItem } from '../../ViewItem.js';
import { TreeSection } from '../TreeSection.js';
import { WebElement } from 'selenium-webdriver';
import { NullAttributeError } from '../../../../errors/NullAttributeError.js';

/**
 * Default tree item base on the items in explorer view
 */
export class DefaultTreeItem extends TreeItem {
	constructor(element: WebElement, viewPart: TreeSection) {
		super(element, viewPart);
	}

	async getLabel(): Promise<string> {
		const value = await this.getAttribute(DefaultTreeItem.locators.DefaultTreeSection.itemLabel);
		if (value === null) {
			throw new NullAttributeError(`${this.constructor.name}.getLabel returned null`);
		}
		return value;
	}

	async getTooltip(): Promise<string> {
		const tooltip = await this.findElement(DefaultTreeItem.locators.DefaultTreeItem.tooltip);
		return await tooltip.getAttribute(DefaultTreeItem.locators.DefaultTreeItem.labelAttribute);
	}

	async isExpanded(): Promise<boolean> {
		const twistieClass = await this.findElement(DefaultTreeItem.locators.DefaultTreeItem.twistie).getAttribute('class');
		return twistieClass.indexOf('collapsed') < 0;
	}

	async getChildren(): Promise<TreeItem[]> {
		const rows = await this.getChildItems(DefaultTreeItem.locators.DefaultTreeSection.itemRow);
		const items = await Promise.all(rows.map(async (row) => new DefaultTreeItem(row, this.enclosingItem as TreeSection).wait()));
		return items;
	}

	async isExpandable(): Promise<boolean> {
		const twistieClass = await this.findElement(DefaultTreeItem.locators.DefaultTreeItem.twistie).getAttribute('class');
		return twistieClass.indexOf('collapsible') > -1;
	}
}
