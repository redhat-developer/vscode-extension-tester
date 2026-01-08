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

import { WebDriver, WebElement, Locator, until, error } from 'selenium-webdriver';

export interface WaitOptions {
	/** Maximum time to wait in milliseconds */
	timeout?: number;
	/** Interval between condition checks in milliseconds */
	pollInterval?: number;
	/** Custom error message when timeout is reached */
	message?: string;
}

export interface RetryOptions {
	/** Maximum number of retry attempts */
	maxRetries?: number;
	/** Delay between retries in milliseconds */
	retryDelay?: number;
	/** Multiplier for exponential backoff (default: 1 = linear) */
	backoffMultiplier?: number;
	/** Function to determine if error is retryable */
	isRetryable?: (error: Error) => boolean;
}

export interface StabilityOptions extends WaitOptions {
	/** Number of consecutive stable checks required */
	stableChecks?: number;
	/** Interval between stability checks in milliseconds */
	stabilityInterval?: number;
}

const DEFAULT_TIMEOUT = 5000;
const DEFAULT_POLL_INTERVAL = 100;
const DEFAULT_STABILITY_CHECKS = 3;
const DEFAULT_STABILITY_INTERVAL = 100;

/**
 * Utility class for condition-based waiting operations.
 * Replaces arbitrary sleep() calls with intelligent waiting strategies.
 */
export class WaitHelper {
	private readonly driver: WebDriver;
	private readonly defaultTimeout: number;
	private readonly defaultPollInterval: number;

	constructor(driver: WebDriver, defaultTimeout: number = DEFAULT_TIMEOUT, defaultPollInterval: number = DEFAULT_POLL_INTERVAL) {
		this.driver = driver;
		this.defaultTimeout = defaultTimeout;
		this.defaultPollInterval = defaultPollInterval;
	}

	/**
	 * Wait for a condition to become truthy.
	 * @param condition Async function that returns a value - waiting stops when value is truthy
	 * @param options Wait configuration options
	 * @returns The truthy value returned by the condition
	 */
	async forCondition<T>(condition: () => Promise<T>, options: WaitOptions = {}): Promise<T> {
		const { timeout = this.defaultTimeout, pollInterval = this.defaultPollInterval, message } = options;

		const start = Date.now();
		let lastError: Error | undefined;

		while (Date.now() - start < timeout) {
			try {
				const result = await condition();
				if (result) {
					return result;
				}
			} catch (e) {
				// Store error but continue retrying for transient errors
				if (e instanceof error.StaleElementReferenceError || e instanceof error.NoSuchElementError) {
					lastError = e as Error;
				} else {
					throw e;
				}
			}
			await this.sleep(pollInterval);
		}

		const errorMessage = message || `Condition not met within ${timeout}ms`;
		if (lastError) {
			throw new Error(`${errorMessage}. Last error: ${lastError.message}`);
		}
		throw new Error(errorMessage);
	}

	/**
	 * Wait for an element's attribute to have a specific value.
	 * @param element The WebElement to check
	 * @param attribute Name of the attribute
	 * @param value Expected value
	 * @param options Wait configuration options
	 */
	async forAttributeValue(element: WebElement, attribute: string, value: string, options: WaitOptions = {}): Promise<void> {
		const { timeout = this.defaultTimeout, message } = options;

		await this.forCondition(async () => (await element.getAttribute(attribute)) === value, {
			...options,
			timeout,
			message: message || `Attribute '${attribute}' did not become '${value}' within ${timeout}ms`,
		});
	}

	/**
	 * Wait for an element's attribute to contain a specific value.
	 * @param element The WebElement to check
	 * @param attribute Name of the attribute
	 * @param value Value to search for
	 * @param options Wait configuration options
	 */
	async forAttributeContains(element: WebElement, attribute: string, value: string, options: WaitOptions = {}): Promise<void> {
		const { timeout = this.defaultTimeout, message } = options;

		await this.forCondition(
			async () => {
				const attrValue = await element.getAttribute(attribute);
				return attrValue?.includes(value);
			},
			{
				...options,
				timeout,
				message: message || `Attribute '${attribute}' did not contain '${value}' within ${timeout}ms`,
			},
		);
	}

	/**
	 * Wait for an element to become stable (position/size stops changing).
	 * Useful for waiting after animations or dynamic content loading.
	 *
	 * Note: If the element becomes stale (removed from DOM), this method returns
	 * successfully since element removal is a form of "stability".
	 *
	 * @param element The WebElement to monitor
	 * @param options Stability configuration options
	 */
	async forStable(element: WebElement, options: StabilityOptions = {}): Promise<void> {
		const { timeout = this.defaultTimeout, stableChecks = DEFAULT_STABILITY_CHECKS, stabilityInterval = DEFAULT_STABILITY_INTERVAL, message } = options;

		const start = Date.now();
		let lastRect: { x: number; y: number; width: number; height: number };
		let stableCount = 0;

		try {
			lastRect = await element.getRect();
		} catch (e) {
			if (e instanceof error.StaleElementReferenceError || e instanceof error.NoSuchElementError) {
				// Element already gone - consider it stable
				return;
			}
			throw e;
		}

		while (Date.now() - start < timeout) {
			await this.sleep(stabilityInterval);

			try {
				const currentRect = await element.getRect();

				if (this.rectsEqual(lastRect, currentRect)) {
					stableCount++;
					if (stableCount >= stableChecks) {
						return;
					}
				} else {
					stableCount = 0;
					lastRect = currentRect;
				}
			} catch (e) {
				if (e instanceof error.StaleElementReferenceError || e instanceof error.NoSuchElementError) {
					// Element was removed from DOM - consider it stable/done
					return;
				}
				throw e;
			}
		}

		throw new Error(message || `Element did not stabilize within ${timeout}ms`);
	}

	/**
	 * Wait for an element to become visible.
	 * @param element The WebElement to check
	 * @param options Wait configuration options
	 */
	async forVisible(element: WebElement, options: WaitOptions = {}): Promise<void> {
		const { timeout = this.defaultTimeout, message } = options;

		await this.driver.wait(until.elementIsVisible(element), timeout, message || `Element did not become visible within ${timeout}ms`);
	}

	/**
	 * Wait for an element to become invisible.
	 * @param element The WebElement to check
	 * @param options Wait configuration options
	 */
	async forNotVisible(element: WebElement, options: WaitOptions = {}): Promise<void> {
		const { timeout = this.defaultTimeout, message } = options;

		await this.driver.wait(until.elementIsNotVisible(element), timeout, message || `Element did not become invisible within ${timeout}ms`);
	}

	/**
	 * Wait for an element to become enabled.
	 * @param element The WebElement to check
	 * @param options Wait configuration options
	 */
	async forEnabled(element: WebElement, options: WaitOptions = {}): Promise<void> {
		const { timeout = this.defaultTimeout, message } = options;

		await this.driver.wait(until.elementIsEnabled(element), timeout, message || `Element did not become enabled within ${timeout}ms`);
	}

	/**
	 * Wait for the number of elements matching a condition to stabilize.
	 * Useful for lists that are loading items dynamically.
	 * @param getCount Function that returns the current count
	 * @param options Stability configuration options
	 */
	async forCountStable(getCount: () => Promise<number>, options: StabilityOptions = {}): Promise<number> {
		const { timeout = this.defaultTimeout, stableChecks = DEFAULT_STABILITY_CHECKS, stabilityInterval = DEFAULT_STABILITY_INTERVAL, message } = options;

		const start = Date.now();
		let lastCount = await getCount();
		let stableCount = 0;

		while (Date.now() - start < timeout) {
			await this.sleep(stabilityInterval);

			const currentCount = await getCount();

			if (currentCount === lastCount) {
				stableCount++;
				if (stableCount >= stableChecks) {
					return currentCount;
				}
			} else {
				stableCount = 0;
				lastCount = currentCount;
			}
		}

		throw new Error(message || `Count did not stabilize within ${timeout}ms`);
	}

	/**
	 * Wait for text content to be present in an element.
	 * @param element The WebElement to check
	 * @param text Expected text (partial match)
	 * @param options Wait configuration options
	 */
	async forTextPresent(element: WebElement, text: string, options: WaitOptions = {}): Promise<void> {
		const { timeout = this.defaultTimeout, message } = options;

		await this.forCondition(
			async () => {
				const elementText = await element.getText();
				return elementText.includes(text);
			},
			{
				...options,
				timeout,
				message: message || `Text '${text}' did not appear within ${timeout}ms`,
			},
		);
	}

	/**
	 * Wait for an element's class list to contain a specific class.
	 * @param element The WebElement to check
	 * @param className Class name to look for
	 * @param options Wait configuration options
	 */
	async forClass(element: WebElement, className: string, options: WaitOptions = {}): Promise<void> {
		await this.forAttributeContains(element, 'class', className, {
			...options,
			message: options.message || `Element did not get class '${className}' within ${options.timeout || this.defaultTimeout}ms`,
		});
	}

	/**
	 * Wait for an element's class list to NOT contain a specific class.
	 * @param element The WebElement to check
	 * @param className Class name that should not be present
	 * @param options Wait configuration options
	 */
	async forNoClass(element: WebElement, className: string, options: WaitOptions = {}): Promise<void> {
		const { timeout = this.defaultTimeout, message } = options;

		await this.forCondition(
			async () => {
				const classAttr = await element.getAttribute('class');
				return !classAttr?.includes(className);
			},
			{
				...options,
				timeout,
				message: message || `Element still has class '${className}' after ${timeout}ms`,
			},
		);
	}

	/**
	 * Wait for an element to be clickable (visible AND enabled).
	 * @param element The WebElement to check
	 * @param options Wait configuration options
	 */
	async forClickable(element: WebElement, options: WaitOptions = {}): Promise<void> {
		const { timeout = this.defaultTimeout, message } = options;

		await this.forCondition(
			async () => {
				try {
					const isDisplayed = await element.isDisplayed();
					const isEnabled = await element.isEnabled();
					return isDisplayed && isEnabled;
				} catch (e) {
					if (e instanceof error.StaleElementReferenceError) {
						return false;
					}
					throw e;
				}
			},
			{
				...options,
				timeout,
				message: message || `Element did not become clickable within ${timeout}ms`,
			},
		);
	}

	/**
	 * Wait for text content to match exactly or a regex pattern.
	 * @param element The WebElement to check
	 * @param expected Expected text string or RegExp pattern
	 * @param options Wait configuration options
	 */
	async forTextContent(element: WebElement, expected: string | RegExp, options: WaitOptions = {}): Promise<void> {
		const { timeout = this.defaultTimeout, message } = options;

		await this.forCondition(
			async () => {
				const text = await element.getText();
				if (expected instanceof RegExp) {
					return expected.test(text);
				}
				return text === expected;
			},
			{
				...options,
				timeout,
				message: message || `Text did not match '${expected}' within ${timeout}ms`,
			},
		);
	}

	/**
	 * Wait for a specific number of elements to be present.
	 * @param parent Parent element or driver to search within
	 * @param locator Locator for the elements
	 * @param expectedCount Expected number of elements
	 * @param options Wait configuration options
	 */
	async forElementCount(parent: WebElement | WebDriver, locator: Locator, expectedCount: number, options: WaitOptions = {}): Promise<WebElement[]> {
		const { timeout = this.defaultTimeout, message } = options;

		const result = await this.forCondition(
			async () => {
				const elements = await parent.findElements(locator);
				return elements.length === expectedCount ? elements : null;
			},
			{
				...options,
				timeout,
				message: message || `Expected ${expectedCount} elements but condition not met within ${timeout}ms`,
			},
		);
		return result as WebElement[];
	}

	/**
	 * Wait for at least one element matching the locator to be present.
	 * @param parent Parent element or driver to search within
	 * @param locator Locator for the element
	 * @param options Wait configuration options
	 * @returns The first matching element
	 */
	async forElementLocated(parent: WebElement | WebDriver, locator: Locator, options: WaitOptions = {}): Promise<WebElement> {
		const { timeout = this.defaultTimeout, message } = options;

		const result = await this.forCondition(
			async () => {
				const elements = await parent.findElements(locator);
				return elements.length > 0 ? elements[0] : null;
			},
			{
				...options,
				timeout,
				message: message || `Element not found within ${timeout}ms`,
			},
		);
		return result as WebElement;
	}

	/**
	 * Wait for no elements matching the locator to be present (element removed).
	 * @param parent Parent element or driver to search within
	 * @param locator Locator for the element
	 * @param options Wait configuration options
	 */
	async forNoElement(parent: WebElement | WebDriver, locator: Locator, options: WaitOptions = {}): Promise<void> {
		const { timeout = this.defaultTimeout, message } = options;

		await this.forCondition(
			async () => {
				try {
					const elements = await parent.findElements(locator);
					return elements.length === 0;
				} catch (e) {
					if (e instanceof error.StaleElementReferenceError) {
						return true; // Parent is gone, so element is definitely gone
					}
					throw e;
				}
			},
			{
				...options,
				timeout,
				message: message || `Element still present after ${timeout}ms`,
			},
		);
	}

	/**
	 * Wait for element to be removed from DOM or become stale.
	 * @param element The WebElement to monitor
	 * @param options Wait configuration options
	 */
	async forElementRemoved(element: WebElement, options: WaitOptions = {}): Promise<void> {
		const { timeout = this.defaultTimeout, message } = options;

		await this.forCondition(
			async () => {
				try {
					await element.getTagName(); // Will throw if element is stale
					return false;
				} catch (e) {
					if (e instanceof error.StaleElementReferenceError || e instanceof error.NoSuchElementError) {
						return true;
					}
					throw e;
				}
			},
			{
				...options,
				timeout,
				message: message || `Element was not removed within ${timeout}ms`,
			},
		);
	}

	/**
	 * Wait for any of the conditions to be met (OR logic).
	 * @param conditions Array of condition functions
	 * @param options Wait configuration options
	 * @returns Index of the first condition that was met
	 */
	async forAnyCondition(conditions: Array<() => Promise<boolean>>, options: WaitOptions = {}): Promise<number> {
		const { timeout = this.defaultTimeout, message } = options;

		const result = await this.forCondition(
			async () => {
				for (let i = 0; i < conditions.length; i++) {
					try {
						if (await conditions[i]()) {
							return i;
						}
					} catch {
						// Continue checking other conditions
					}
				}
				return null;
			},
			{
				...options,
				timeout,
				message: message || `None of the conditions were met within ${timeout}ms`,
			},
		);
		return result as number;
	}

	/**
	 * Execute a function with automatic retry on failure.
	 * @param fn The function to execute
	 * @param options Retry configuration options
	 * @returns The result of the function
	 */
	async withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
		const {
			maxRetries = 3,
			retryDelay = 500,
			backoffMultiplier = 1,
			isRetryable = (e) => e.name === 'StaleElementReferenceError' || e.name === 'ElementNotInteractableError',
		} = options;

		let lastError: Error | undefined;

		for (let attempt = 0; attempt <= maxRetries; attempt++) {
			try {
				return await fn();
			} catch (e: any) {
				lastError = e;

				if (!isRetryable(e) || attempt === maxRetries) {
					throw e;
				}

				const delay = retryDelay * Math.pow(backoffMultiplier, attempt);
				await this.sleep(delay);
			}
		}

		// This should never be reached as the loop always throws or returns
		throw lastError ?? new Error('withRetry: unexpected state - no result and no error');
	}

	/**
	 * Simple sleep helper - use sparingly and prefer condition-based waits.
	 * @param ms Milliseconds to sleep
	 */
	async sleep(ms: number): Promise<void> {
		await new Promise((resolve) => setTimeout(resolve, ms));
	}

	/**
	 * Get the WebDriver instance.
	 */
	getDriver(): WebDriver {
		return this.driver;
	}

	private rectsEqual(a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }): boolean {
		return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
	}
}

/**
 * Create a WaitHelper instance bound to a WebDriver.
 * Convenience factory function for quick access.
 */
export function createWaitHelper(driver: WebDriver, defaultTimeout?: number): WaitHelper {
	return new WaitHelper(driver, defaultTimeout);
}
