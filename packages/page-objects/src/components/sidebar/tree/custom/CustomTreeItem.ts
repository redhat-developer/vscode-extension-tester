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

/**
 * View item in a custom-made content section (e.g. an extension tree view)
 */
export class CustomTreeItem extends TreeItem {
	constructor(element: WebElement, viewPart: TreeSection) {
		super(element, viewPart);
	}

	async getLabel(): Promise<string> {
		return await this.findElement(CustomTreeItem.locators.CustomTreeSection.itemLabel).getText();
	}

	async getTooltip(): Promise<string> {
		return await this.getAttribute(CustomTreeItem.locators.CustomTreeItem.tooltipAttribute);
	}

	async getDescription(): Promise<string> {
		return await this.findElement(CustomTreeItem.locators.CustomTreeItem.description).getText();
	}

	async isExpanded(): Promise<boolean> {
		const attr = await this.getAttribute(CustomTreeItem.locators.CustomTreeItem.expandedAttr);
		return attr === CustomTreeItem.locators.CustomTreeItem.expandedValue;
	}

	async getChildren(): Promise<TreeItem[]> {
		const rows = await this.getChildItems(CustomTreeItem.locators.DefaultTreeSection.itemRow);
		const items = await Promise.all(rows.map(async (row) => new CustomTreeItem(row, this.enclosingItem as TreeSection).wait()));
		return items;
	}

	async isExpandable(): Promise<boolean> {
		const attr = await this.getAttribute(CustomTreeItem.locators.CustomTreeItem.expandedAttr);
		return attr !== null;
	}
}
