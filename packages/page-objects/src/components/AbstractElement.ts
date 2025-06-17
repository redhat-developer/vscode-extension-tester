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

import { WebElement, WebDriver, Locator, until, Key } from 'selenium-webdriver';
import { Locators } from '../locators/locators';

/**
 * Default wrapper for webElement
 */
export abstract class AbstractElement extends WebElement {
	public static readonly ctlKey = process.platform === 'darwin' ? Key.COMMAND : Key.CONTROL;
	protected static driver: WebDriver;
	protected static locators: Locators;
	protected static versionInfo: { version: string; browser: string };
	protected enclosingItem: WebElement;

	/**
	 * Constructs a new element from a Locator or an existing WebElement
	 * @param base WebDriver compatible Locator for the given element or a reference to an existing WebElement
	 * @param enclosingItem Locator or a WebElement reference to an element containing the element being constructed
	 * this will be used to narrow down the search for the underlying DOM element
	 */
	constructor(base: Locator | WebElement, enclosingItem?: WebElement | Locator) {
		let item: WebElement = AbstractElement.driver.findElement(AbstractElement.locators.AbstractElement.tag);
		if (!enclosingItem) {
			enclosingItem = item;
		}
		if (enclosingItem instanceof WebElement) {
			item = enclosingItem;
		} else {
			item = AbstractElement.driver.findElement(enclosingItem);
		}

		if (base instanceof WebElement) {
			super(AbstractElement.driver, base.getId());
		} else {
			const toFind = item.findElement(base);
			const id = toFind.getId();
			super(AbstractElement.driver, id);
		}
		this.enclosingItem = item;
	}

	async isEnabled(): Promise<boolean> {
		return (await super.isEnabled()) && (await AbstractElement.locators.AbstractElement.enabled(this));
	}

	async isSelected(): Promise<boolean> {
		return (await super.isSelected()) && (await AbstractElement.locators.AbstractElement.selected(this));
	}

	/**
	 * Wait for the element to become visible
	 * @param timeout custom timeout for the wait
	 * @returns thenable self reference
	 */
	async wait(timeout: number = 5000): Promise<this> {
		await this.getDriver().wait(until.elementIsVisible(this), timeout);
		return this;
	}

	/**
	 * Return a reference to the WebElement containing this element
	 */
	getEnclosingElement(): WebElement {
		return this.enclosingItem;
	}

	static init(locators: Locators, driver: WebDriver, browser: string, version: string) {
		AbstractElement.locators = locators;
		AbstractElement.driver = driver;
		AbstractElement.versionInfo = { version: version, browser: browser };
	}
}
