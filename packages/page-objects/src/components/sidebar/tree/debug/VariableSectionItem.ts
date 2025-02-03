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

import { Key, WebElement } from 'selenium-webdriver';
import { TreeSection } from '../TreeSection';
import { CustomTreeItem } from '../custom/CustomTreeItem';
import { satisfies } from 'compare-versions';

export class VariableSectionItem extends CustomTreeItem {
	constructor(element: WebElement, viewPart: TreeSection) {
		super(element, viewPart);
	}

	/**
	 * Get name of the variable.
	 * @returns a promise resolving to variable name string
	 */
	async getVariableName(): Promise<string> {
		const name = await this.findElement(VariableSectionItem.locators.VariableSectionItem.name.constructor);
		return VariableSectionItem.locators.VariableSectionItem.name.value(name);
	}

	/**
	 * Get value of the variable.
	 * @returns a promise resolving to value string of the variable
	 */
	async getVariableValue(): Promise<string> {
		const value = await this.findElement(VariableSectionItem.locators.VariableSectionItem.value.constructor);
		return VariableSectionItem.locators.VariableSectionItem.value.value(value);
	}

	/**
	 * Get variable name tooltip.
	 * @returns a promise resolving to variable name tooltip string
	 * @deprecated For VS Code 1.88+ this method won't be working any more
	 */
	async getVariableNameTooltip(): Promise<string> {
		if (satisfies(VariableSectionItem.versionInfo.version, '>=1.88.0')) {
			throw Error(`DEPRECATED METHOD! For VS Code 1.88+ this method won't be working any more.`);
		}
		const name = await this.findElement(VariableSectionItem.locators.VariableSectionItem.name.constructor);
		return VariableSectionItem.locators.VariableSectionItem.name.tooltip(name);
	}

	/**
	 * Get variable value tooltip.
	 * @returns a promise resolving to variable value tooltip string
	 * @deprecated For VS Code 1.89+ this method won't be working any more
	 */
	async getVariableValueTooltip(): Promise<string> {
		if (satisfies(VariableSectionItem.versionInfo.version, '>=1.89.0')) {
			throw Error(`DEPRECATED METHOD! For VS Code 1.89+ this method won't be working any more.`);
		}
		const value = await this.findElement(VariableSectionItem.locators.VariableSectionItem.value.constructor);
		return VariableSectionItem.locators.VariableSectionItem.value.tooltip(value);
	}

	async getLabel(): Promise<string> {
		return VariableSectionItem.locators.VariableSectionItem.label(this);
	}

	getTooltip(): Promise<string> {
		throw new Error('unsupported: use either getVariableNameTooltip or getVariableValueTooltip');
	}

	/**
	 * Assign new value to the variable.
	 * @param value new value
	 */
	async setVariableValue(value: string): Promise<void> {
		const valueRootElement = await this.findElement(VariableSectionItem.locators.VariableSectionItem.value.constructor);
		const driver = this.getDriver();
		await driver.actions().clear();
		await driver.actions().doubleClick(valueRootElement).sendKeys(value, Key.ENTER).perform();
	}
}
