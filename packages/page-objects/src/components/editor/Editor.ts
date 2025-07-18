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

import { ElementWithContextMenu } from '../ElementWithContextMenu';
import { EditorTab, EditorView, EditorGroup } from '../..';
import { WebElement, Locator } from 'selenium-webdriver';

/**
 * Abstract representation of an editor tab
 */
export abstract class Editor extends ElementWithContextMenu {
	constructor(view: EditorView | EditorGroup = new EditorView(), base: Locator | WebElement = Editor.locators.Editor.constructor) {
		super(base, view);
	}

	protected async reinitialize(): Promise<this> {
		const editorView = this.enclosingItem as EditorView;
		const title = await this.getTitle();
		const reopened = await editorView.openEditor(title);

		// Check if we got the same type back
		if (!(reopened instanceof (this.constructor as any))) {
			throw new Error(`Reopened editor is not the same type as original.`);
		}
		return reopened as this;
	}

	/**
	 * Get title/name of the open editor
	 */
	async getTitle(): Promise<string> {
		const tab = await this.getTab();
		return await tab.getTitle();
	}

	/**
	 * Get the corresponding editor tab
	 */
	async getTab(): Promise<EditorTab> {
		const element = this.enclosingItem as EditorView | EditorGroup;
		return (await element.getActiveTab()) as EditorTab;
	}
}
