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

import { ExtensionEditorView } from '../..';

export class ExtensionEditorDetailsSection extends ExtensionEditorView {
	/**
	 * Get all categories of extension.
	 * @returns Promise resolving categories of extension.
	 */
	async getCategories(): Promise<string[]> {
		const categories: string[] = [];

		const container = await this.findElement(ExtensionEditorDetailsSection.locators.ExtensionEditorDetailsSection.categoriesContainer);
		const categoriesInContainer = await container.findElements(ExtensionEditorDetailsSection.locators.ExtensionEditorDetailsSection.category);

		for (const cat of categoriesInContainer) {
			categories.push(await cat.getText());
		}
		return categories;
	}

	/**
	 * Get all resources of extension.
	 * @returns Promise resolving resources of extension.
	 */
	async getResources(): Promise<string[]> {
		const resources: string[] = [];

		const container = await this.findElement(ExtensionEditorDetailsSection.locators.ExtensionEditorDetailsSection.resourcesContainer);
		const resourcesInContainer = await container.findElements(ExtensionEditorDetailsSection.locators.ExtensionEditorDetailsSection.resource);

		for (const res of resourcesInContainer) {
			resources.push(await res.getText());
		}

		return resources;
	}

	/**
	 * Get content of More Info section.
	 * @returns Promise resolving content of 'More Info' section.
	 */
	async getMoreInfo(): Promise<{ [key: string]: string }> {
		const moreInfo: { [key: string]: string } = {};

		const container = await this.findElement(ExtensionEditorDetailsSection.locators.ExtensionEditorDetailsSection.moreInfoContainer);
		const moreInfoInContainer = await container.findElements(ExtensionEditorDetailsSection.locators.ExtensionEditorDetailsSection.moreInfo);

		for (const entry of moreInfoInContainer) {
			const elmnts = await entry.findElements(ExtensionEditorDetailsSection.locators.ExtensionEditorDetailsSection.moreInfoElements);
			const name = await (await elmnts.at(0))?.getText();
			const value = await (await elmnts.at(1))?.getText();
			if (name !== undefined && value !== undefined) {
				moreInfo[name] = value;
			}
		}

		return moreInfo;
	}

	/**
	 * Get value of specific attribute from 'More Info' section.
	 * @param key Name of attribute.
	 * @returns Promise resolving value for specified attribute.
	 */
	async getMoreInfoItem(key: string): Promise<string> {
		const moreInfo = await this.getMoreInfo();
		return moreInfo[key];
	}

	/**
	 * Blocked by https://github.com/redhat-developer/vscode-extension-tester/issues/1492
	 */
	async getReadme(): Promise<Error> {
		return Error('Not implemented yet.');
	}
}
