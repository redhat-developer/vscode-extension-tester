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
import { ElementWithContextMenu } from '../ElementWithContextMenu';

/**
 * View with channel selector
 */
export abstract class ChannelView extends ElementWithContextMenu {
	protected actionsLabel!: string;

	/**
	 * Get names of all selectable channels
	 * @returns Promise resolving to array of strings - channel names
	 */
	async getChannelNames(): Promise<string[]> {
		const names: string[] = [];
		const elements = await (
			await this.enclosingItem.findElement(ChannelView.locators.BottomBarViews.actionsContainer(this.actionsLabel))
		).findElements(ChannelView.locators.BottomBarViews.channelOption);

		await Promise.all(
			elements.map(async (element) => {
				const disabled = await element.getAttribute('disabled');
				if (!disabled) {
					names.push(await element.getAttribute('value'));
				}
			}),
		);

		return names;
	}

	/**
	 * Get name of the current channel
	 * @returns Promise resolving to the current channel name
	 * @deprecated For VS Code 1.88+ this method won't be working any more
	 */
	async getCurrentChannel(): Promise<string> {
		if (ChannelView.versionInfo.version >= '1.87.0' && process.platform !== 'darwin') {
			throw Error(
				`DEPRECATED METHOD! The 'ChannelView.getCurrentChannel' method is broken! Read more information in 'Known Issues > Limitations in testing with VS Code 1.87+' - https://github.com/microsoft/vscode/issues/206897.`,
			);
		}
		const combo = await this.enclosingItem.findElement(ChannelView.locators.BottomBarViews.channelCombo);
		return await combo.getAttribute('title');
	}

	/**
	 * Select a channel using the selector combo
	 * @param name name of the channel to open
	 */
	async selectChannel(name: string): Promise<void> {
		const combo = await this.enclosingItem.findElement(ChannelView.locators.BottomBarViews.channelCombo);
		const option = await combo.findElement(ChannelView.locators.OutputView.optionByName(name));
		await option.click();
	}
}

/**
 * View with channel selection and text area
 */
export abstract class TextView extends ChannelView {
	declare protected actionsLabel: string;

	/**
	 * Get all text from the currently open channel
	 * @returns Promise resolving to the view's text
	 */
	async getText(): Promise<string> {
		const clipboard = (await import('clipboardy')).default;
		let originalClipboard = '';
		try {
			originalClipboard = clipboard.readSync();
		} catch (error) {
			// workaround issue https://github.com/redhat-developer/vscode-extension-tester/issues/835
			// do not fail if clipboard is empty
		}
		const textarea = await this.findElement(ChannelView.locators.BottomBarViews.textArea);
		await textarea.sendKeys(Key.chord(TextView.ctlKey, 'a'));
		await textarea.sendKeys(Key.chord(TextView.ctlKey, 'c'));
		const text = clipboard.readSync();
		// workaround as we are getting "element click intercepted" during the send keys actions.
		// await textarea.click();
		if (originalClipboard.length > 0) {
			clipboard.writeSync(originalClipboard);
		}
		return text;
	}

	/**
	 * Clear the text in the current channel
	 * @returns Promise resolving when the clear text button is pressed
	 */
	async clearText(): Promise<void> {
		await this.enclosingItem
			.findElement(ChannelView.locators.BottomBarViews.actionsContainer(this.actionsLabel))
			.findElement(ChannelView.locators.BottomBarViews.clearText)
			.click();
	}
}
