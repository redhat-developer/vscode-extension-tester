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
import { WaitHelper } from '../utils/WaitHelper';
import { ElementRecoveryError, wrapError, type ErrorContext } from '../errors/ExTesterError';

/**
 * Information needed to relocate an element after it becomes stale.
 */
export interface LocatorInfo {
	/** The locator used to find this element */
	locator: Locator;
	/** The parent element or locator this element was found within */
	enclosingLocator?: Locator | WebElement;
}

/**
 * Default wrapper for webElement
 */
export abstract class AbstractElement extends WebElement {
	public static readonly ctlKey = process.platform === 'darwin' ? Key.COMMAND : Key.CONTROL;
	protected static driver: WebDriver;
	protected static locators: Locators;
	protected static versionInfo: { version: string; browser: string };
	protected static waitHelper: WaitHelper;

	protected enclosingItem: WebElement;

	/**
	 * Locator information for auto-recovery when element becomes stale.
	 * Stored when element is created with a Locator (not a WebElement).
	 */
	protected locatorInfo?: LocatorInfo;

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
			// Cannot store locator info for WebElement-based construction
		} else {
			const toFind = item.findElement(base);
			const id = toFind.getId();
			super(AbstractElement.driver, id);

			// Store locator info for potential recovery
			this.locatorInfo = {
				locator: base,
				enclosingLocator: enclosingItem,
			};
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
	 * Wait for the element to become stable (position/size stops changing).
	 * Useful after animations or dynamic content loading.
	 * @param timeout Maximum time to wait in milliseconds
	 * @returns thenable self reference
	 */
	async waitForStable(timeout: number = 2000): Promise<this> {
		await AbstractElement.waitHelper.forStable(this, { timeout });
		return this;
	}

	/**
	 * Return a reference to the WebElement containing this element
	 */
	getEnclosingElement(): WebElement {
		return this.enclosingItem;
	}

	/**
	 * Get the stored locator information for this element, if available.
	 */
	getLocatorInfo(): LocatorInfo | undefined {
		return this.locatorInfo;
	}

	/**
	 * Check if this element can be automatically recovered when stale.
	 */
	canAutoRecover(): boolean {
		return this.locatorInfo !== undefined;
	}

	/**
	 * Get the WaitHelper instance for condition-based waiting.
	 */
	protected getWaitHelper(): WaitHelper {
		return AbstractElement.waitHelper;
	}

	/**
	 * Create error context for this element.
	 * Useful for creating detailed error messages.
	 */
	protected createErrorContext(action: string, details?: string): ErrorContext {
		return {
			component: this.constructor.name,
			action,
			vscodeVersion: AbstractElement.versionInfo?.version,
			locator: this.locatorInfo?.locator?.toString(),
			details,
		};
	}

	static init(locators: Locators, driver: WebDriver, browser: string, version: string) {
		AbstractElement.locators = locators;
		AbstractElement.driver = driver;
		AbstractElement.versionInfo = { version: version, browser: browser };
		AbstractElement.waitHelper = new WaitHelper(driver);
	}

	/**
	 * Execute a function with automatic recovery from stale element references.
	 * If the element becomes stale during execution, it will be relocated and
	 * the function will be retried once.
	 *
	 * @param fn The async function to execute
	 * @param maxRetries Maximum number of recovery attempts (default: 1)
	 * @returns The result of the function
	 */
	async withRecovery<T>(fn: (self: this) => Promise<T>, maxRetries: number = 1): Promise<T> {
		let lastError: Error | undefined;
		let currentElement: this = this;

		for (let attempt = 0; attempt <= maxRetries; attempt++) {
			try {
				return await fn(currentElement);
			} catch (err: any) {
				const isRecoverable =
					err.name === 'StaleElementReferenceError' ||
					err.name === 'ElementNotInteractableError' ||
					/element.*(detached|not interactable)/i.test(err.message);

				if (isRecoverable && attempt < maxRetries) {
					try {
						currentElement = await this.reinitialize();
					} catch (reinitErr) {
						// Recovery failed, throw original error with context
						throw wrapError(err, this.createErrorContext('withRecovery', `Recovery failed: ${(reinitErr as Error).message}`));
					}
					lastError = err;
				} else {
					throw wrapError(err, this.createErrorContext('withRecovery'));
				}
			}
		}

		// Should not reach here, but just in case
		throw lastError || new Error('Unexpected error in withRecovery');
	}

	/**
	 * Re-locate this element using stored locator information.
	 * This is called automatically by withRecovery() when an element becomes stale.
	 *
	 * Subclasses can override this for custom recovery logic, but the default
	 * implementation works for most cases when the element was created with a locator.
	 *
	 * @returns A new instance of this element type pointing to the relocated DOM element
	 * @throws ElementRecoveryError if the element cannot be recovered
	 */
	protected async reinitialize(): Promise<this> {
		if (!this.locatorInfo) {
			throw new ElementRecoveryError(
				`Cannot auto-recover ${this.constructor.name}: no locator information stored. ` +
					`Element was likely created from a WebElement reference. ` +
					`Override reinitialize() in ${this.constructor.name} for custom recovery logic.`,
				this.createErrorContext('reinitialize'),
			);
		}

		try {
			// Resolve the parent element
			let parentElement: WebElement;
			if (this.locatorInfo.enclosingLocator instanceof WebElement) {
				parentElement = this.locatorInfo.enclosingLocator;
			} else if (this.locatorInfo.enclosingLocator) {
				parentElement = await AbstractElement.driver.findElement(this.locatorInfo.enclosingLocator);
			} else {
				parentElement = await AbstractElement.driver.findElement(AbstractElement.locators.AbstractElement.tag);
			}

			// Find the element again
			const newElement = await parentElement.findElement(this.locatorInfo.locator);

			// Create a new instance of the same class
			const Constructor = this.constructor as new (base: WebElement, enclosingItem?: WebElement) => this;
			const recovered = new Constructor(newElement, parentElement);

			// Copy over the locator info so subsequent recoveries work
			recovered.locatorInfo = this.locatorInfo;

			return recovered;
		} catch (err) {
			throw new ElementRecoveryError(`Failed to relocate ${this.constructor.name}`, {
				...this.createErrorContext('reinitialize'),
				cause: err as Error,
			});
		}
	}

	/**
	 * Safely click on the element with automatic retry on stale/interactable errors.
	 */
	async safeClick(): Promise<void> {
		await this.withRecovery(async (self) => {
			await self.click();
		});
	}

	/**
	 * Safely send keys to the element with automatic retry on stale/interactable errors.
	 */
	async safeSendKeys(...keys: (string | Promise<string>)[]): Promise<void> {
		await this.withRecovery(async (self) => {
			await self.sendKeys(...keys);
		});
	}

	/**
	 * Safely get text from the element with automatic retry on stale errors.
	 */
	async safeGetText(): Promise<string> {
		return await this.withRecovery(async (self) => {
			return await self.getText();
		});
	}

	/**
	 * Safely get attribute from the element with automatic retry on stale errors.
	 */
	async safeGetAttribute(name: string): Promise<string> {
		return await this.withRecovery(async (self) => {
			return await self.getAttribute(name);
		});
	}
}
