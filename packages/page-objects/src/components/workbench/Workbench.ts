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

import { AbstractElement } from '../AbstractElement';
import { WebElement, Key, until } from 'selenium-webdriver';
import { TitleBar } from '../menu/TitleBar';
import { SideBarView } from '../sidebar/SideBarView';
import { ActivityBar } from '../activityBar/ActivityBar';
import { StatusBar } from '../statusBar/StatusBar';
import { EditorView } from '../editor/EditorView';
import { BottomBarPanel } from '../bottomBar/BottomBarPanel';
import { Notification, StandaloneNotification } from './Notification';
import { NotificationsCenter } from './NotificationsCenter';
import { QuickOpenBox } from './input/QuickOpenBox';
import { SettingsEditor } from '../editor/SettingsEditor';
import { InputBox } from './input/InputBox';
import { satisfies } from 'compare-versions';

/**
 * Handler for general workbench related actions
 */
export class Workbench extends AbstractElement {
	constructor() {
		super(Workbench.locators.Workbench.constructor);
	}

	/**
	 * Get a title bar handle
	 */
	getTitleBar(): TitleBar {
		return new TitleBar();
	}

	/**
	 * Get a side bar handle
	 */
	getSideBar(): SideBarView {
		return new SideBarView();
	}

	/**
	 * Get an activity bar handle
	 */
	getActivityBar(): ActivityBar {
		return new ActivityBar();
	}

	/**
	 * Get a status bar handle
	 */
	getStatusBar(): StatusBar {
		return new StatusBar();
	}

	/**
	 * Get a bottom bar handle
	 */
	getBottomBar(): BottomBarPanel {
		return new BottomBarPanel();
	}

	/**
	 * Get a handle for the editor view
	 */
	getEditorView(): EditorView {
		return new EditorView();
	}

	/**
	 * Get all standalone notifications (notifications outside the notifications center)
	 * @returns Promise resolving to array of Notification objects
	 */
	async getNotifications(): Promise<Notification[]> {
		const notifications: Notification[] = [];
		let container: WebElement;
		try {
			container = await this.findElement(Workbench.locators.Workbench.notificationContainer);
		} catch (err) {
			return [];
		}
		const elements = await container.findElements(Workbench.locators.Workbench.notificationItem);

		for (const element of elements) {
			notifications.push(await new StandaloneNotification(element).wait());
		}
		return notifications;
	}

	/**
	 * Opens the notifications center
	 * @returns Promise resolving to NotificationsCenter object
	 */
	async openNotificationsCenter(): Promise<NotificationsCenter> {
		return await new StatusBar().openNotificationsCenter();
	}

	/**
	 * Opens the settings editor
	 *
	 * @returns promise that resolves to a SettingsEditor instance
	 */
	async openSettings(): Promise<SettingsEditor> {
		await this.executeCommand('Preferences: Open User Settings');
		await new EditorView().openEditor('Settings');
		await Workbench.driver.wait(until.elementLocated(Workbench.locators.Editor.constructor));
		await new Promise((res) => setTimeout(res, 500));
		return new SettingsEditor();
	}

	/**
	 * Open the VS Code command line prompt
	 * @returns Promise resolving to InputBox (vscode 1.44+) or QuickOpenBox (vscode up to 1.43) object
	 */
	async openCommandPrompt(): Promise<QuickOpenBox | InputBox> {
		const webview = await new EditorView().findElements(EditorView.locators.EditorView.webView);
		if (webview.length > 0) {
			const tab = await new EditorView().getActiveTab();
			if (tab) {
				await tab.sendKeys(Key.F1);
				return await InputBox.create();
			}
		}
		const driver = this.getDriver();
		await driver.actions().keyDown(Workbench.ctlKey).keyDown(Key.SHIFT).sendKeys('p').perform();

		if (satisfies(Workbench.versionInfo.version, '>=1.44.0')) {
			return await InputBox.create();
		}
		return await QuickOpenBox.create();
	}

	/**
	 * Open the command prompt, type in a command and execute
	 * @param command text of the command to be executed
	 * @returns Promise resolving when the command prompt is confirmed
	 */
	async executeCommand(command: string): Promise<void> {
		const prompt = await this.openCommandPrompt();
		await prompt.setText(`>${command}`);
		const quickPicks = await Promise.all((await prompt.getQuickPicks()).map((item) => item.getLabel()));
		if (quickPicks.includes(command)) {
			await prompt.selectQuickPick(command);
		} else {
			await prompt.confirm();
		}
	}
}
