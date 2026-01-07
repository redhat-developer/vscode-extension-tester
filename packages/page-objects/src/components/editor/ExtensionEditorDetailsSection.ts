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

import { ExtensionEditorView, WebView } from '../..';

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
			try {
				categories.push(await cat.getText());
			} catch (e: any) {
				if (e.name === 'StaleElementReferenceError') {
					continue;
				}
				throw e;
			}
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
			try {
				resources.push(await res.getText());
			} catch (e: any) {
				if (e.name === 'StaleElementReferenceError') {
					continue;
				}
				throw e;
			}
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
			try {
				const elmnts = await entry.findElements(ExtensionEditorDetailsSection.locators.ExtensionEditorDetailsSection.moreInfoElements);
				const name = await elmnts.at(0)?.getText();
				const value = await elmnts.at(1)?.getText();
				if (name !== undefined && value !== undefined) {
					moreInfo[name] = value;
				}
			} catch (e: any) {
				if (e.name === 'StaleElementReferenceError') {
					continue;
				}
				throw e;
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
	 * Get readme WebView element.
	 * @returns Promise resolving WebView element containing the readme content.
	 */
	async getReadme(): Promise<WebView> {
		return new WebView();
	}

	/**
	 * Get readme content as a string.
	 * @returns Promise resolving the text content of the readme.
	 */
	async getReadmeContent(): Promise<string> {
		const view = await this.getReadme();
		await view.switchToFrame(5000);
		const readmeContent = await view.findWebElement(ExtensionEditorDetailsSection.locators.ExtensionEditorDetailsSection.readmeContent);
		const text = await readmeContent.getText();
		await view.switchBack();
		return text;
	}

	/**
	 * Get version of extension.
	 * @returns Promise resolving version of extension.
	 */
	async getVersion(): Promise<string> {
		const moreInfo = await this.getMoreInfo();
		return moreInfo['Version'];
	}
}
