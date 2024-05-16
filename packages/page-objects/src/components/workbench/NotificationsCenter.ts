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

import { Key } from 'selenium-webdriver';
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
		await this.findElement(NotificationsCenter.locators.NotificationsCenter.clear).click();
	}

	/**
	 * Get all notifications of a given type
	 * @param type type of the notifications to look for,
	 * NotificationType.Any will retrieve all notifications
	 *
	 * @returns Promise resolving to array of Notification objects
	 */
	async getNotifications(type: NotificationType): Promise<Notification[]> {
		const notifications: Notification[] = [];
		const elements = await this.findElements(NotificationsCenter.locators.NotificationsCenter.row);

		for (const element of elements) {
			const not = new CenterNotification(element);
			if (type === NotificationType.Any || (await not.getType()) === type) {
				notifications.push(await not.wait());
			}
		}
		return notifications;
	}
}
