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

import { Input, QuickPickItem } from '../../../index.js';
import { until } from 'selenium-webdriver';

/**
 * Plain input box variation of the input page object
 */
export class InputBox extends Input {
	constructor() {
		super(InputBox.locators.InputBox.constructor, InputBox.locators.Workbench.constructor);
	}

	/**
	 * Construct a new InputBox instance after waiting for its underlying element to exist
	 * Use when an input box is scheduled to appear.
	 * @param timeout max time to wait in milliseconds, default 5000
	 */
	static async create(timeout: number = 5000): Promise<InputBox> {
		await InputBox.driver.wait(until.elementLocated(InputBox.locators.InputBox.constructor), timeout);
		return new InputBox().wait();
	}

	/**
	 * Get the message below the input field
	 */
	async getMessage(): Promise<string> {
		return await this.findElement(InputBox.locators.InputBox.message).getText();
	}

	async hasProgress(): Promise<boolean> {
		const klass = await this.findElement(InputBox.locators.InputBox.progress).getAttribute('class');
		return klass.indexOf('done') < 0;
	}

	async getQuickPicks(): Promise<QuickPickItem[]> {
		const picks: QuickPickItem[] = [];
		const elements = await this.findElement(InputBox.locators.InputBox.quickList)
			.findElement(InputBox.locators.InputBox.rows)
			.findElements(InputBox.locators.InputBox.row);

		for (const element of elements) {
			if (await element.isDisplayed()) {
				picks.push(await new QuickPickItem(+(await element.getAttribute('data-index')), this).wait());
			}
		}
		return picks;
	}

	async getCheckboxes(): Promise<QuickPickItem[]> {
		const picks: QuickPickItem[] = [];
		const elements = await this.findElement(InputBox.locators.InputBox.quickList)
			.findElement(InputBox.locators.InputBox.rows)
			.findElements(InputBox.locators.InputBox.row);

		for (const element of elements) {
			if (await element.isDisplayed()) {
				picks.push(await new QuickPickItem(+(await element.getAttribute('data-index')), this, true).wait());
			}
		}

		return picks;
	}

	/**
	 * Find whether the input is showing an error
	 * @returns Promise resolving to notification message
	 */
	async hasError(): Promise<boolean> {
		const klass = await this.findElement(InputBox.locators.Input.inputBox).getAttribute('class');
		return klass.indexOf('error') > -1;
	}

	/**
	 * Check if the input field is masked (input type password)
	 * @returns Promise resolving to notification message
	 */
	async isPassword(): Promise<boolean> {
		const input = await this.findElement(InputBox.locators.Input.input);
		return (await input.getAttribute('type')) === 'password';
	}
}
