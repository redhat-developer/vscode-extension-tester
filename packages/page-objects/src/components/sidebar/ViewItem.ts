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

import { ElementWithContexMenu } from '../ElementWithContextMenu';
import { AbstractElement } from '../AbstractElement';
import { WebElement, By, error } from 'selenium-webdriver';
import { NullAttributeError } from '../../errors/NullAttributeError';

/**
 * Arbitrary item in the side bar view
 */
export abstract class ViewItem extends ElementWithContexMenu {
	/**
	 * Select the item in the view.
	 * Note that selecting the item will toggle its expand state when applicable.
	 * @returns Promise resolving when the item has been clicked
	 */
	async select(): Promise<void> {
		await this.click();
	}
}

/**
 * Abstract representation of a row in the tree inside a view content section
 */
export abstract class TreeItem extends ViewItem {
	/**
	 * Retrieves the label of this view item
	 */
	abstract getLabel(): Promise<string>;

	/**
	 * Retrieves the tooltip of this TreeItem.
	 * @returns A promise resolving to the tooltip or undefined if the TreeItem has no tooltip.
	 */
	async getTooltip(): Promise<string | undefined> {
		return undefined;
	}

	/**
	 * Retrieves the description of this TreeItem.
	 * @returns A promise resolving to the tooltip or undefined if the TreeItem has no description.
	 */
	async getDescription(): Promise<string | undefined> {
		return undefined;
	}

	/**
	 * Finds if the item has children by actually counting the child items
	 * Note that this will expand the item if it was collapsed
	 * @returns Promise resolving to true/false
	 */
	async hasChildren(): Promise<boolean> {
		const children = await this.getChildren();
		return children && children.length > 0;
	}

	/**
	 * Finds whether the item is expanded. Always returns false if item has no children.
	 * @returns Promise resolving to true/false
	 */
	abstract isExpanded(): Promise<boolean>;

	/**
	 * Find children of an item, will try to expand the item in the process
	 * @returns Promise resolving to array of TreeItem objects, empty array if item has no children
	 */
	abstract getChildren(): Promise<TreeItem[]>;

	/**
	 * Finds if the item is expandable/collapsible
	 * @returns Promise resolving to true/false
	 */
	abstract isExpandable(): Promise<boolean>;

	/**
	 * Expands the current item, if it can be expanded and is collapsed.
	 */
	async expand(): Promise<void> {
		if ((await this.isExpandable()) && !(await this.isExpanded())) {
			await (await this.findTwistie()).click();
		}
	}

	/**
	 * Find a child item with the given name
	 * @returns Promise resolving to TreeItem object if the child item exists, undefined otherwise
	 */
	async findChildItem(name: string): Promise<TreeItem | undefined> {
		const children = await this.getChildren();
		for (const item of children) {
			if ((await item.getLabel()) === name) {
				return item;
			}
		}
	}

	/**
	 * Collapse the item if expanded
	 */
	async collapse(): Promise<void> {
		if ((await this.isExpandable()) && (await this.isExpanded())) {
			await (await this.findTwistie()).click();
		}
	}

	/**
	 * Find all action buttons bound to the view item
	 *
	 * @returns array of ViewItemAction objects, empty array if item has no
	 * actions associated
	 */
	async getActionButtons(): Promise<ViewItemAction[]> {
		await this.getDriver().actions().move({ origin: this }).perform();

		let container: WebElement;
		try {
			container = await this.findElement(TreeItem.locators.TreeItem.actions);
		} catch (e) {
			if (e instanceof error.NoSuchElementError) {
				return [];
			}
			throw e;
		}

		const actions: ViewItemAction[] = [];
		const items = await container.findElements(TreeItem.locators.TreeItem.actionLabel);

		for (const item of items) {
			const label = await item.getAttribute(TreeItem.locators.TreeItem.actionTitle);

			if (label === '' || label === null) {
				// unknown, skip the item
				continue;
			}

			try {
				actions.push(new ViewItemAction(ViewItemAction.locators.ViewSection.actionConstructor(label), this));
			} catch (e) {
				// the item was destroyed in meantime
				if (e instanceof error.NoSuchElementError) {
					continue;
				}

				if (e instanceof error.StaleElementReferenceError) {
					console.warn('ViewItem has become stale');
				}

				throw e;
			}
		}

		return actions;
	}

	/**
	 * Find action button for view item by label
	 * @param label label of the button to search by
	 *
	 * @returns ViewItemAction object if such button exists, undefined otherwise
	 */
	async getActionButton(label: string): Promise<ViewItemAction | undefined> {
		const actions = await this.getActionButtons();

		for (const action of actions) {
			try {
				if ((await action.getLabel()).includes(label)) {
					return action;
				}
			} catch (e) {
				if (e instanceof NullAttributeError || e instanceof error.StaleElementReferenceError) {
					continue;
				}
				throw e;
			}
		}

		return undefined;
	}

	/**
	 * Find all child elements of a tree item
	 * @param locator locator of a given type of tree item
	 */
	protected async getChildItems(locator: By): Promise<WebElement[]> {
		const items: WebElement[] = [];
		await this.expand();

		const rows = await this.enclosingItem.findElements(locator);
		const baseIndex = +(await this.getAttribute(TreeItem.locators.ViewSection.index));
		const baseLevel = +(await this.getAttribute(TreeItem.locators.ViewSection.level));

		for (const row of rows) {
			const level = +(await row.getAttribute(TreeItem.locators.ViewSection.level));
			const index = +(await row.getAttribute(TreeItem.locators.ViewSection.index));

			if (index <= baseIndex) {
				continue;
			}
			if (level > baseLevel + 1) {
				continue;
			}
			if (level <= baseLevel) {
				break;
			}

			items.push(row);
		}

		return items;
	}

	protected async findTwistie(): Promise<WebElement> {
		return await this.findElement(TreeItem.locators.TreeItem.twistie);
	}
}

/**
 * Action button bound to a view item
 */
export class ViewItemAction extends AbstractElement {
	constructor(actionConstructor: By, viewItem: TreeItem) {
		super(actionConstructor, viewItem);
	}

	/**
	 * Get label of the action button
	 */
	async getLabel(): Promise<string> {
		const value = await this.getAttribute(ViewItemAction.locators.ViewSection.buttonLabel);

		if (value === null) {
			throw new NullAttributeError(`${this.constructor.name}.getLabel returned null`);
		}

		return value;
	}
}
