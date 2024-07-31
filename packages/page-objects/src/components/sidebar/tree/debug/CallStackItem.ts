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
import { TreeSection } from '../TreeSection';
import { CustomTreeItem } from '../custom/CustomTreeItem';

export class CallStackItem extends CustomTreeItem {
	constructor(element: WebElement, viewPart: TreeSection) {
		super(element, viewPart);
	}

	/**
	 * Get label of the Call Stack item.
	 * @returns a promise resolving to Call Stack item label string
	 */
	async getLabel(): Promise<string> {
		const name = await this.findElement(CallStackItem.locators.CallStackItem.label);
		return await name?.getAttribute('textContent');
	}

	/**
	 * Get text of the Call Stack item.
	 * @returns a promise resolving to Call Stack item text string
	 */
	async getText(): Promise<string> {
		const value = await this.findElement(CallStackItem.locators.CallStackItem.text);
		return await value.getText();
	}
}
