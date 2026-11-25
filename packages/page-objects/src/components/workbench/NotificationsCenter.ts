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

import { Key, error } from 'selenium-webdriver';
import { AbstractElement } from '../AbstractElement';
import { Notification, CenterNotification, NotificationType } from './Notification';

/**
 * Notifications center page object
 */
export class NotificationsCenter extends AbstractElement {
	constructor() {
		super(NotificationsCenter.locators.NotificationsCenter.constructor, NotificationsCenter.locators.Workbench.constructor);
	}

	/**
	 * Close the notifications center
	 * @returns Promise resolving when the center is closed
	 */
	async close(): Promise<void> {
		if (await this.isDisplayed()) {
			try {
				await this.findElement(NotificationsCenter.locators.NotificationsCenter.close).click();
			} catch (error) {
				await this.click();
				await this.getDriver().actions().sendKeys(Key.ESCAPE).perform();
			}
		}
	}

	/**
	 * Clear all notifications in the notifications center
	 * Note that this will also hide the notifications center
	 * @returns Promise resolving when the clear all button is pressed
	 */
	async clearAllNotifications(): Promise<void> {
		const btn = await this.findElement(NotificationsCenter.locators.NotificationsCenter.clear);
		const classes = (await btn.getAttribute('class')) ?? '';
		if (classes.includes('disabled')) {
			return;
		}
		await this.getDriver().executeScript('arguments[0].click()', btn);
	}

	/**
	 * Get all notifications of a given type
	 * VS Code can close the center by itself, for example when a notification is removed or the
	 * window is busy; the center is opened again first, so the notifications it holds can be read.
	 * Each row is waited for as before; a row that does not show within that time (or is gone
	 * meanwhile) is left out instead of failing the whole call.
	 * @param type type of the notifications to look for,
	 * NotificationType.Any will retrieve all notifications
	 *
	 * @returns Promise resolving to array of Notification objects
	 */
	async getNotifications(type: NotificationType): Promise<Notification[]> {
		await this.reopenIfClosed();
		const notifications: Notification[] = [];
		const elements = await this.findElements(NotificationsCenter.locators.NotificationsCenter.row);

		for (const element of elements) {
			try {
				const not = new CenterNotification(element);
				if (type === NotificationType.Any || (await not.getType()) === type) {
					notifications.push(await not.wait());
				}
			} catch (e) {
				if (e instanceof error.StaleElementReferenceError || e instanceof error.NoSuchElementError || e instanceof error.TimeoutError) {
					continue;
				}
				throw e;
			}
		}
		return notifications;
	}

	/**
	 * Wait until the center lists a notification whose message contains the given text or matches
	 * the given expression. Notifications can reach the center well after the action that shows them,
	 * and the newest one is not always the one a test is waiting for.
	 * @param message text the message contains, or a regular expression it matches
	 * @param timeout time to wait in milliseconds
	 * @returns Promise resolving to the matching notification
	 */
	async waitForNotification(message: string | RegExp, timeout: number = 10_000): Promise<Notification> {
		const matches = (text: string) => (typeof message === 'string' ? text.includes(message) : message.test(text));
		const found = await this.getDriver().wait<Notification | undefined>(
			async () => {
				for (const notification of await this.getNotifications(NotificationType.Any)) {
					try {
						if (matches(await notification.getMessage())) {
							return notification;
						}
					} catch (e) {
						if (!(e instanceof error.StaleElementReferenceError || e instanceof error.NoSuchElementError)) {
							throw e;
						}
					}
				}
				return undefined;
			},
			timeout,
			`Notification "${String(message)}" did not appear within ${timeout} ms`,
		);
		return found as Notification;
	}

	/**
	 * Open the center again when VS Code has closed it, using the bell in the status bar.
	 * Fails like `StatusBar.openNotificationsCenter()` when the center does not open.
	 */
	private async reopenIfClosed(): Promise<void> {
		if (await this.isDisplayed()) {
			return;
		}
		await this.getDriver().findElement(NotificationsCenter.locators.StatusBar.bell).click();
		try {
			await this.getDriver().wait(async () => await this.isDisplayed(), 3000);
		} catch {
			throw new Error('Notifications center did not open');
		}
	}
}
