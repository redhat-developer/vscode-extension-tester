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
import { TreeSection } from '../TreeSection.js';
import { CustomTreeItem } from '../custom/CustomTreeItem.js';
import { SectionBreakpoint } from './SectionBreakpoint.js';

export class BreakpointSectionItem extends CustomTreeItem {
	constructor(element: WebElement, viewPart: TreeSection) {
		super(element, viewPart);
	}

	/**
	 * Get breakpoint element which has context menu.
	 * @returns SectionBreakpoint page object
	 */
	async getBreakpoint(): Promise<SectionBreakpoint> {
		return new SectionBreakpoint(BreakpointSectionItem.locators.BreakpointSectionItem.breakpoint.constructor, this);
	}

	/**
	 * Get status of the breakpoint.
	 * @returns boolean indicating status
	 */
	async isBreakpointEnabled(): Promise<boolean> {
		const locator = BreakpointSectionItem.locators.BreakpointSectionItem.breakpointCheckbox;
		const el = await this.findElement(locator.constructor);
		return await locator.value(el);
	}

	/**
	 * Change breakpoint status to desired state.
	 * @param value new state
	 */
	async setBreakpointEnabled(value: boolean): Promise<void> {
		if ((await this.isBreakpointEnabled()) === value) {
			return;
		}
		const locator = BreakpointSectionItem.locators.BreakpointSectionItem.breakpointCheckbox;
		const el = await this.findElement(locator.constructor);
		await el.click();
	}

	async getLabel(): Promise<string> {
		const locator = BreakpointSectionItem.locators.BreakpointSectionItem.label;
		const el = await this.findElement(locator.constructor);
		return await locator.value(el);
	}

	/**
	 * Get breakpoint file path. Empty string is returned if path is not specified.
	 * @returns file path of breakpoint or empty string
	 */
	async getBreakpointFilePath(): Promise<string> {
		const locator = BreakpointSectionItem.locators.BreakpointSectionItem.filePath;
		const el = await this.findElement(locator.constructor);
		return await locator.value(el);
	}

	/**
	 * Get line number of the breakpoint.
	 * @returns number indicating line position in file
	 */
	async getBreakpointLine(): Promise<number> {
		const locator = BreakpointSectionItem.locators.BreakpointSectionItem.lineNumber;
		const el = await this.findElement(locator.constructor);
		return Number.parseInt(await locator.value(el));
	}
}
