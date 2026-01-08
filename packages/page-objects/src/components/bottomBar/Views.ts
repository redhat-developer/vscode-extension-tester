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

import { Key, until } from 'selenium-webdriver';
import { BottomBarPanel, ContentAssist, Workbench } from '../..';
import { TextView, ChannelView } from './AbstractViews';
import { ElementWithContextMenu } from '../ElementWithContextMenu';

/**
 * Output view of the bottom panel
 */
export class OutputView extends TextView {
	constructor(panel: BottomBarPanel = new BottomBarPanel()) {
		super(OutputView.locators.OutputView.constructor, panel);
		this.actionsLabel = OutputView.locators.OutputView.actionsLabel;
	}

	protected async reinitialize(): Promise<this> {
		const panel = this.enclosingItem as BottomBarPanel;
		const view = await panel.openOutputView();
		return view as this;
	}

	/**
	 * Select a channel using the selector combo
	 * @param name name of the channel to open
	 */
	async selectChannel(name: string): Promise<void> {
		await super.selectChannel(name);
	}
}

/**
 * Debug Console view on the bottom panel
 * Most functionality will only be available when a debug session is running
 */
export class DebugConsoleView extends ElementWithContextMenu {
	constructor(panel: BottomBarPanel = new BottomBarPanel()) {
		super(DebugConsoleView.locators.DebugConsoleView.constructor, panel);
	}

	protected async reinitialize(): Promise<this> {
		const panel = this.enclosingItem as BottomBarPanel;
		const view = await panel.openDebugConsoleView();
		return view as this;
	}

	/**
	 * Clear the console of all text
	 */
	async clearText(): Promise<void> {
		const menu = await this.openContextMenu();
		await menu.select('Clear Console');
	}

	/**
	 * Type an expression into the debug console text area
	 * @param expression expression in form of a string
	 */
	async setExpression(expression: string): Promise<void> {
		await this.withRecovery(async (self) => {
			const textarea = await self.findElement(DebugConsoleView.locators.BottomBarViews.textArea);
			await textarea.sendKeys(Key.chord(DebugConsoleView.ctlKey, 'a'));
			await textarea.sendKeys(expression);
		});
	}

	/**
	 * Evaluate an expression:
	 *  - if no argument is supplied, evaluate the current expression present in debug console text area
	 *  - if a string argument is supplied, replace the current expression with the `expression` argument and evaluate
	 *
	 * @param expression expression to evaluate. To use existing contents of the debug console text area instead, don't define this argument
	 */
	async evaluateExpression(expression?: string): Promise<void> {
		await this.withRecovery(async (self) => {
			const textarea = await self.findElement(DebugConsoleView.locators.BottomBarViews.textArea);
			if (expression) {
				await self.setExpression(expression);
			}
			await textarea.sendKeys(Key.ENTER);
		});
	}

	/**
	 * Create a content assist page object
	 * @returns promise resolving to ContentAssist object
	 */
	async getContentAssist(): Promise<ContentAssist> {
		await this.getDriver().wait(until.elementLocated(ContentAssist.locators.ContentAssist.constructor), 1000);
		return new ContentAssist(this).wait();
	}
}

/**
 * Terminal view on the bottom panel
 */
export class TerminalView extends ChannelView {
	constructor(panel: BottomBarPanel = new BottomBarPanel()) {
		super(TerminalView.locators.TerminalView.constructor, panel);
		this.actionsLabel = TerminalView.locators.TerminalView.actionsLabel;
	}

	/**
	 * Execute command in the internal terminal and wait for results
	 * @param command text of the command
	 * @param timeout optional maximum time to wait for completion in milliseconds, 0 for unlimited
	 * @returns Promise resolving when the command is finished
	 */
	async executeCommand(command: string, timeout: number = 0): Promise<void> {
		const input = await this.findElement(TerminalView.locators.TerminalView.textArea);

		try {
			await input.clear();
		} catch (err) {
			// try clearing, ignore if not available
		}
		await input.sendKeys(command, Key.ENTER);

		// Wait for command to complete by monitoring cursor position
		const effectiveTimeout = timeout > 0 ? timeout : 30000;
		await this.getWaitHelper().forCondition(
			async () => {
				const style = await input.getCssValue('left');
				return style !== '0px';
			},
			{
				timeout: effectiveTimeout,
				pollInterval: 200,
				message: `Terminal command did not complete within ${effectiveTimeout}ms`,
			},
		);
	}

	/**
	 * Get all text from the internal terminal
	 * Beware, no formatting.
	 *
	 * @returns Promise resolving to all terminal text
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
		const workbench = new Workbench();
		await workbench.executeCommand('terminal select all');
		// Wait for clipboard to be updated
		await this.getWaitHelper().forCondition(
			async () => {
				try {
					const current = clipboard.readSync();
					return current !== originalClipboard;
				} catch {
					return false;
				}
			},
			{ timeout: 2000, pollInterval: 100 },
		);
		const text = clipboard.readSync();
		if (originalClipboard.length > 0) {
			clipboard.writeSync(originalClipboard);
		}
		return text;
	}

	/**
	 * Destroy the currently open terminal
	 * @returns Promise resolving when Kill Terminal button is pressed
	 */
	async killTerminal(): Promise<void> {
		await new Workbench().executeCommand('terminal: kill the active terminal instance');
	}

	/**
	 * Initiate new terminal creation
	 * @returns Promise resolving when New Terminal button is pressed
	 */
	async newTerminal(): Promise<void> {
		await new Workbench().executeCommand(TerminalView.locators.TerminalView.newCommand);
		const combo = await this.enclosingItem.findElements(ChannelView.locators.BottomBarViews.channelCombo);
		if (combo.length < 1) {
			await this.getDriver().wait(async () => {
				const list = await this.findElements(TerminalView.locators.TerminalView.tabList);
				return list.length > 0;
			}, 5000);
		}
	}

	async getCurrentChannel(): Promise<string> {
		const combo = await this.enclosingItem.findElements(ChannelView.locators.BottomBarViews.channelCombo);
		if (combo.length > 0) {
			return await super.getCurrentChannel();
		}
		const singleTerm = await this.enclosingItem.findElements(TerminalView.locators.TerminalView.singleTab);
		if (singleTerm.length > 0) {
			return await singleTerm[0].getText();
		}
		const list = await this.findElement(TerminalView.locators.TerminalView.tabList);
		const row = await list.findElement(TerminalView.locators.TerminalView.selectedRow);
		// Wait for row to have a valid aria-label
		await this.getWaitHelper().forCondition(
			async () => {
				const label = await row.getAttribute('aria-label');
				return label && label.split(' ').length >= 3;
			},
			{ timeout: 2000, pollInterval: 100 },
		);
		const label = (await row.getAttribute('aria-label')).split(' ');

		return `${label[1]}: ${label[2]}`;
	}

	async selectChannel(name: string): Promise<void> {
		const combo = await this.enclosingItem.findElements(ChannelView.locators.BottomBarViews.channelCombo);
		if (combo.length > 0) {
			return await super.selectChannel(name);
		}
		const singleTerm = await this.enclosingItem.findElements(TerminalView.locators.TerminalView.singleTab);
		if (singleTerm.length > 0) {
			return;
		}

		const matches = /.*(\d+).?\s.*/.exec(name);
		if (matches === null || !matches[1]) {
			throw new Error(`Channel ${name} not found`);
		}
		const channelNumber = matches[1];

		const list = await this.findElement(TerminalView.locators.TerminalView.tabList);
		const rows = await list.findElements(TerminalView.locators.TerminalView.row);

		for (const row of rows) {
			const label = await row.getAttribute('aria-label');
			if (label.includes(channelNumber)) {
				await row.click();
				return;
			}
		}
		throw new Error(`Channel ${name} not found`);
	}
}
