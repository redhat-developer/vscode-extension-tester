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

import { Editor } from '../..';

export class ExtensionEditorView extends Editor {
	constructor() {
		super(undefined, ExtensionEditorView.locators.ExtensionEditorView.constructor);
	}

	/**
	 * Get name of extension.
	 * @returns Promise resolving name of extension.
	 */
	async getName(): Promise<string> {
		const name = await this.findElement(ExtensionEditorView.locators.ExtensionEditorView.name);
		return await name?.getText();
	}

	/**
	 * Get version of extension.
	 * @returns Promise resolving version of extension.
	 */
	async getVersion(): Promise<string> {
		const name = await this.findElement(ExtensionEditorView.locators.ExtensionEditorView.version);
		return await name?.getText();
	}

	/**
	 * Get publisher of extension.
	 * @returns Promise resolving publisher of extension.
	 */
	async getPublisher(): Promise<string> {
		const name = await this.findElement(ExtensionEditorView.locators.ExtensionEditorView.publisher);
		return await name?.getText();
	}

	/**
	 * Get description of extension.
	 * @returns Promise description name of opened extension.
	 */
	async getDescription(): Promise<string> {
		const name = await this.findElement(ExtensionEditorView.locators.ExtensionEditorView.description);
		return await name?.getText();
	}

	/**
	 * Get count of extension.
	 * @returns Promise resolving count of opened extension.
	 */
	async getCount(): Promise<string> {
		const count = await this.findElement(ExtensionEditorView.locators.ExtensionEditorView.count);
		return await count?.getText();
	}

	/**
	 * Get available tabs.
	 * @returns Promise resolving tabs of opened extension.
	 */
	async getTabs(): Promise<string[]> {
		const tabs: string[] = [];
		const navbar = await this.findElement(ExtensionEditorView.locators.ExtensionEditorView.navbar);
		const els = await navbar.findElements(ExtensionEditorView.locators.ExtensionEditorView.tab);
		for (const element of els) {
			tabs.push(await element.getText());
		}
		return tabs;
	}

	/**
	 * Switch to different tab.
	 * @param tabName Name of required tab to be switched on.
	 * @returns Promise resolving to true if tabs were switched successfully, false otherwise.
	 */
	async switchToTab(tabName: string): Promise<boolean> {
		const navbar = await this.findElement(ExtensionEditorView.locators.ExtensionEditorView.navbar);
		const requiredTab = await navbar.findElement(ExtensionEditorView.locators.ExtensionEditorView.specificTab(tabName));
		await requiredTab.click();
		return (await this.getActiveTab()).toLowerCase() === tabName.toLowerCase();
	}

	/**
	 * Get name of opened tab.
	 * @returns Promise resolving name of opened tab.
	 */
	async getActiveTab(): Promise<string> {
		const navbar = await this.findElement(ExtensionEditorView.locators.ExtensionEditorView.navbar);
		const features = await navbar.findElement(ExtensionEditorView.locators.ExtensionEditorView.activeTab);
		return await features.getText();
	}
}
