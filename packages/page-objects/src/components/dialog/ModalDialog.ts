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

import { WebElement } from 'selenium-webdriver';
import { AbstractElement } from '../AbstractElement.js';

/**
 * Page Object for Custom Style Modal Dialogs (non-native)
 */
export class ModalDialog extends AbstractElement {
	constructor() {
		super(ModalDialog.locators.Dialog.constructor);
	}

	/**
	 * Get the dialog's message in a Promise
	 */
	async getMessage(): Promise<string> {
		const message = await this.findElement(ModalDialog.locators.Dialog.message);
		return await message.getText();
	}

	/**
	 * Get the details message in a Promise
	 */
	async getDetails(): Promise<string> {
		const details = await this.findElement(ModalDialog.locators.Dialog.details);
		return await details.getText();
	}

	/**
	 * Get the list of buttons as WebElements
	 *
	 * @returns Promise resolving to Array of WebElement items representing the buttons
	 */
	async getButtons(): Promise<WebElement[]> {
		return await this.findElement(ModalDialog.locators.Dialog.buttonContainer).findElements(ModalDialog.locators.Dialog.button);
	}

	/**
	 * Push a button with given title if it exists
	 *
	 * @param title title/text of the button
	 */
	async pushButton(title: string): Promise<void> {
		const buttons = await this.getButtons();
		const titles = await Promise.all(buttons.map(async (btn) => ModalDialog.locators.Dialog.buttonLabel.value(btn)));
		const index = titles.findIndex((value) => value === title);
		if (index > -1) {
			await buttons[index].click();
		}
	}

	/**
	 * Close the dialog using the 'cross' button
	 */
	async close(): Promise<void> {
		const btn = await this.findElement(ModalDialog.locators.Dialog.closeButton);
		return await btn.click();
	}
}
