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

import { until, WebElement } from 'selenium-webdriver';
import { ContextMenu, ViewContent, ViewItem, waitForAttributeValue, WelcomeContentSection } from '../..';
import { AbstractElement } from '../AbstractElement';
import { ElementWithContextMenu } from '../ElementWithContextMenu';
import { ChromiumWebDriver } from 'selenium-webdriver/chromium';
import { ActionButtonElementDropdown } from '../ActionButtonElementDropdown';

export type ViewSectionConstructor<T extends ViewSection> = {
	new (rootElement: WebElement, tree: ViewContent): T;
};

/**
 * Page object representing a collapsible content section of the side bar view
 */
export abstract class ViewSection extends AbstractElement {
	constructor(panel: WebElement, content: ViewContent) {
		super(panel, content);
	}

	/**
	 * Get the title of the section as string
	 * @returns Promise resolving to section title
	 */
	async getTitle(): Promise<string> {
		const title = await this.findElement(ViewSection.locators.ViewSection.title);
		return await title.getAttribute(ViewSection.locators.ViewSection.titleText);
	}

	/**
	 * Expand the section if collapsed
	 * @returns Promise resolving when the section is expanded
	 */
	async expand(timeout: number = 1_000): Promise<void> {
		if (await this.isHeaderHidden()) {
			return;
		}
		if (!(await this.isExpanded())) {
			const header = await this.findElement(ViewSection.locators.ViewSection.header);
			const collapseExpandButton = await header.findElement(ViewSection.locators.ViewSection.headerCollapseExpandButton);
			await collapseExpandButton.click();
			await this.getDriver().wait(waitForAttributeValue(header, ViewSection.locators.ViewSection.headerExpanded, 'true'), timeout);
			// Wait for expand animation to complete
			await this.getWaitHelper().forStable(this, { timeout: 1000 });
		}
	}

	/**
	 * Collapse the section if expanded
	 * @returns Promise resolving when the section is collapsed
	 */
	async collapse(timeout: number = 1_000): Promise<void> {
		if (await this.isHeaderHidden()) {
			return;
		}
		if (await this.isExpanded()) {
			const header = await this.findElement(ViewSection.locators.ViewSection.header);
			const collapseExpandButton = await header.findElement(ViewSection.locators.ViewSection.headerCollapseExpandButton);
			await collapseExpandButton.click();
			await this.getDriver().wait(waitForAttributeValue(header, ViewSection.locators.ViewSection.headerExpanded, 'false'), timeout);
			// Wait for collapse animation to complete
			await this.getWaitHelper().forStable(this, { timeout: 1000 });
		}
	}

	/**
	 * Finds whether the section is expanded
	 * @returns Promise resolving to true/false
	 */
	async isExpanded(): Promise<boolean> {
		const header = await this.findElement(ViewSection.locators.ViewSection.header);
		const expanded = await header.getAttribute(ViewSection.locators.ViewSection.headerExpanded);
		return expanded === 'true';
	}

	/**
	 * Finds [Welcome Content](https://code.visualstudio.com/api/extension-guides/tree-view#welcome-content)
	 * present in this ViewSection and returns it. If none is found, then `undefined` is returned
	 *
	 */
	public async findWelcomeContent(): Promise<WelcomeContentSection | undefined> {
		try {
			const res = await this.findElement(ViewSection.locators.ViewSection.welcomeContent);
			if (!(await res.isDisplayed())) {
				return undefined;
			}
			return new WelcomeContentSection(res, this);
		} catch (_err) {
			return undefined;
		}
	}

	/**
	 * Retrieve all items currently visible in the view section.
	 * Note that any item currently beyond the visible list, i.e. not scrolled to, will not be retrieved.
	 * @returns Promise resolving to array of ViewItem objects
	 */
	abstract getVisibleItems(): Promise<ViewItem[]>;

	/**
	 * Find an item in this view section by label. Does not perform recursive search through the whole tree.
	 * Does however scroll through all the expanded content. Will find items beyond the current scroll range.
	 * @param label Label of the item to search for.
	 * @param maxLevel Limit how deep the algorithm should look into any expanded items, default unlimited (0)
	 * @returns Promise resolving to ViewItem object is such item exists, undefined otherwise
	 */
	abstract findItem(label: string, maxLevel?: number): Promise<ViewItem | undefined>;

	/**
	 * Open an item with a given path represented by a sequence of labels
	 *
	 * e.g to open 'file' inside 'folder', call
	 * openItem('folder', 'file')
	 *
	 * The first item is only searched for directly within the root element (depth 1).
	 * The label sequence is handled in order. If a leaf item (a file for example) is found in the middle
	 * of the sequence, the rest is ignored.
	 *
	 * If the item structure is flat, use the item's title to search by.
	 *
	 * @param path Sequence of labels that make up the path to a given item.
	 * @returns Promise resolving to array of ViewItem objects representing the last item's children.
	 * If the last item is a leaf, empty array is returned.
	 */
	abstract openItem(...path: string[]): Promise<ViewItem[]>;

	/**
	 * Retrieve the action buttons on the section's header
	 * @returns Promise resolving to array of ViewPanelAction objects
	 */
	async getActions(): Promise<ViewPanelAction[]> {
		await this.getDriver().actions().move({ origin: this }).perform(); // move mouse to bring auto-hided buttons visible
		const actions = await this.findElement(ViewSection.locators.ViewSection.actions).findElements(ViewSection.locators.ViewSection.button);
		return Promise.all(
			actions.map(async (action) => {
				const dropdown = (await action.getAttribute('aria-haspopup')) || (await action.getAttribute('aria-expanded'));
				if (dropdown) {
					return new ViewPanelActionDropdown(action, this);
				} else {
					return new ViewPanelAction(action, this);
				}
			}),
		);
	}

	/**
	 * Retrieve an action button on the sections's header by its label
	 * @param label label/title of the button
	 * @returns ViewPanelAction object if found, undefined otherwise
	 */
	async getAction(label: string): Promise<ViewPanelAction | undefined> {
		const actions = await this.getActions();
		for (const action of actions) {
			if ((await action.getLabel()) === label) {
				return action;
			}
		}
	}

	/**
	 * Click on the More Actions... item if it exists
	 *
	 * @returns ContextMenu page object if the action succeeds, undefined otherwise
	 */
	async moreActions(): Promise<ContextMenu | undefined> {
		const more = await this.getAction('More Actions...');
		if (!more) {
			return undefined;
		}
		const section = this;
		const btn = new (class extends ElementWithContextMenu {
			async openContextMenu() {
				await this.click();
				const shadowRootHost = await section.findElements(ViewSection.locators.ViewSection.shadowRootHost);
				if (shadowRootHost.length > 0) {
					let shadowRoot;
					const webdriverCapabilities = await (this.getDriver() as ChromiumWebDriver).getCapabilities();
					const chromiumVersion = webdriverCapabilities.getBrowserVersion();
					if (chromiumVersion && parseInt(chromiumVersion.split('.')[0]) >= 96) {
						shadowRoot = await shadowRootHost[0].getShadowRoot();
						return new ContextMenu(await shadowRoot.findElement(ViewSection.locators.ViewSection.monacoMenuContainer)).wait();
					} else {
						shadowRoot = (await this.getDriver().executeScript('return arguments[0].shadowRoot', shadowRootHost[0])) as WebElement;
						return new ContextMenu(shadowRoot).wait();
					}
				}
				return await super.openContextMenu();
			}
		})(more, this);
		return await btn.openContextMenu();
	}

	private async isHeaderHidden(): Promise<boolean> {
		const header = await this.findElement(ViewSection.locators.ViewSection.header);
		return (await header.getAttribute('class')).indexOf('hidden') > -1;
	}
}

/**
 * Base class for action buttons on view sections.
 * Provides shared functionality for both standard and dropdown actions.
 */
abstract class BaseViewPanelAction extends ActionButtonElementDropdown {
	constructor(element: WebElement, viewPart: ViewSection) {
		super(element, viewPart);
	}

	/**
	 * Get label of the action button
	 */
	async getLabel(): Promise<string> {
		return await this.getAttribute(BaseViewPanelAction.locators.ViewSection.buttonLabel);
	}

	/**
	 * Wait for the action button to be located within a given timeout.
	 * @param timeout Time in milliseconds (default: 1000ms)
	 */
	async wait(timeout: number = 1_000): Promise<this> {
		await this.getDriver().wait(until.elementLocated(BaseViewPanelAction.locators.ViewSection.actions), timeout);
		return this;
	}
}

export class ViewPanelAction extends BaseViewPanelAction {}

export class ViewPanelActionDropdown extends BaseViewPanelAction {}
