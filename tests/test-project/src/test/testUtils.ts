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

import { VSBrowser, WaitHelper, Workbench, NotificationType } from 'vscode-extension-tester';

/**
 * Singleton instance of WaitHelper for test utilities.
 * Initialized lazily on first access.
 */
let waitHelperInstance: WaitHelper | undefined;

/**
 * Get a WaitHelper instance for condition-based waiting in tests.
 * This provides access to robust waiting methods that replace arbitrary sleep() calls.
 *
 * @example
 * ```typescript
 * const wait = getWaitHelper();
 *
 * // Wait for condition
 * await wait.forCondition(async () => await element.isDisplayed());
 *
 * // Wait for element stability
 * await wait.forStable(element);
 *
 * // Wait for text content
 * await wait.forTextContent(element, 'Expected text');
 *
 * // Retry flaky operations
 * await wait.withRetry(async () => await flakyOperation());
 * ```
 */
export function getWaitHelper(): WaitHelper {
	if (!waitHelperInstance) {
		waitHelperInstance = new WaitHelper(VSBrowser.instance.driver);
	}
	return waitHelperInstance;
}

/**
 * Reset the WaitHelper instance. Call this if the driver changes.
 */
export function resetWaitHelper(): void {
	waitHelperInstance = undefined;
}

/**
 * Wait for notifications center to have notifications.
 * @param timeout Maximum time to wait in milliseconds
 */
export async function waitForNotifications(timeout: number = 5000): Promise<void> {
	const wait = getWaitHelper();
	await wait.forCondition(
		async () => {
			const center = await new Workbench().openNotificationsCenter();
			const notifications = await center.getNotifications(NotificationType.Any);
			return notifications.length > 0;
		},
		{ timeout, message: 'Notifications did not appear' },
	);
}

/**
 * Wait for a condition with clear error message.
 * Wrapper around WaitHelper.forCondition with better defaults for tests.
 *
 * @param condition The condition to wait for
 * @param options Configuration options
 */
export async function waitFor<T>(condition: () => Promise<T>, options: { timeout?: number; message?: string; pollInterval?: number } = {}): Promise<T> {
	const wait = getWaitHelper();
	return await wait.forCondition(condition, {
		timeout: options.timeout ?? 10000,
		pollInterval: options.pollInterval ?? 200,
		message: options.message,
	});
}

/**
 * Retry a flaky operation multiple times before failing.
 * Useful for operations that may fail intermittently on CI.
 *
 * @param fn The operation to retry
 * @param options Configuration options
 */
export async function retry<T>(
	fn: () => Promise<T>,
	options: {
		maxRetries?: number;
		retryDelay?: number;
		exponentialBackoff?: boolean;
	} = {},
): Promise<T> {
	const wait = getWaitHelper();
	return await wait.withRetry(fn, {
		maxRetries: options.maxRetries ?? 3,
		retryDelay: options.retryDelay ?? 500,
		backoffMultiplier: options.exponentialBackoff ? 2 : 1,
	});
}

/**
 * Wait for element position/size to stabilize.
 * Useful after animations or dynamic content loading.
 *
 * @param element The element to wait for stability
 * @param timeout Maximum time to wait
 */
export async function waitForStable(
	element: { getRect: () => Promise<{ x: number; y: number; width: number; height: number }> },
	timeout: number = 2000,
): Promise<void> {
	const wait = getWaitHelper();
	await wait.forStable(element as any, { timeout });
}

/**
 * Clear all notifications and wait for center to close.
 */
export async function clearNotifications(): Promise<void> {
	const wait = getWaitHelper();
	try {
		const center = await new Workbench().openNotificationsCenter();
		await center.clearAllNotifications();
		await wait.forCondition(
			async () => {
				try {
					return !(await center.isDisplayed());
				} catch {
					return true; // Center is gone
				}
			},
			{ timeout: 5000, message: 'Notifications center did not close' },
		);
	} catch {
		// Ignore if already closed
	}
}

/**
 * Wait for workbench to be ready after opening resources.
 */
export async function waitForWorkbench(): Promise<void> {
	await VSBrowser.instance.waitForWorkbench();
	const wait = getWaitHelper();
	// Additional stability wait
	await wait.sleep(500);
}
