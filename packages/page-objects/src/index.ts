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

import { WebDriver } from 'selenium-webdriver';
import { AbstractElement } from './components/AbstractElement.js';
import { LocatorLoader } from './locators/loader.js';

export * from 'selenium-webdriver';
export * from './locators/locators.js';
export * from './errors/NullAttributeError.js';

export * from './components/menu/Menu.js';
export * from './components/menu/MenuItem.js';
export * from './components/menu/TitleBar.js';
export * from './components/menu/MacTitleBar.js';
export * from './components/menu/ContextMenu.js';
export * from './components/menu/WindowControls.js';

export * from './components/activityBar/ActivityBar.js';
export * from './components/activityBar/ViewControl.js';
export * from './components/activityBar/ActionsControl.js';

export * from './components/sidebar/SideBarView.js';
export * from './components/sidebar/ViewTitlePart.js';
export * from './components/sidebar/ViewContent.js';
export * from './components/sidebar/ViewSection.js';
export * from './components/sidebar/ViewItem.js';
export * from './components/sidebar/WelcomeContent.js';

export * from './components/sidebar/tree/TreeSection.js';
export * from './components/sidebar/tree/default/DefaultTreeSection.js';
export * from './components/sidebar/tree/default/DefaultTreeItem.js';
export * from './components/sidebar/tree/custom/CustomTreeSection.js';
export * from './components/sidebar/tree/custom/CustomTreeItem.js';
export * from './components/sidebar/tree/debug/DebugBreakpointSection.js';
export * from './components/sidebar/tree/debug/BreakpointSectionItem.js';
export * from './components/sidebar/tree/debug/DebugVariablesSection.js';
export * from './components/sidebar/tree/debug/VariableSectionItem.js';
export * from './components/sidebar/tree/debug/CallStackItem.js';
export * from './components/sidebar/tree/debug/DebugCallStackSection.js';
export * from './components/sidebar/tree/debug/WatchSection.js';
export * from './components/sidebar/tree/debug/WatchSectionItem.js';
export * from './components/sidebar/extensions/ExtensionsViewSection.js';
export * from './components/sidebar/extensions/ExtensionsViewItem.js';
export { ScmView, ScmProvider, ScmChange } from './components/sidebar/scm/ScmView.js';
export * from './components/sidebar/scm/NewScmView.js';
export * from './components/sidebar/debug/DebugView.js';

export * from './components/bottomBar/BottomBarPanel.js';
export * from './components/bottomBar/ProblemsView.js';
export * from './components/bottomBar/WebviewView.js';
export * from './components/bottomBar/Views.js';
export * from './components/statusBar/StatusBar.js';

export * from './components/editor/EditorView.js';
export * from './components/editor/EditorAction.js';
export * from './components/editor/Breakpoint.js';
export * from './components/editor/TextEditor.js';
export * from './components/editor/Editor.js';
export * from './components/editor/SettingsEditor.js';
export * from './components/editor/DiffEditor.js';
export * from './components/editor/WebView.js';
export * from './components/editor/ContentAssist.js';
export * from './components/editor/CustomEditor.js';
export * from './components/editor/ExtensionEditorView.js';
export * from './components/editor/ExtensionEditorDetailsSection.js';

export { Notification, NotificationType } from './components/workbench/Notification.js';
export * from './components/workbench/NotificationsCenter.js';
export * from './components/workbench/input/Input.js';
export * from './components/workbench/input/InputBox.js';
export * from './components/workbench/input/QuickOpenBox.js';
export * from './components/workbench/Workbench.js';
export * from './components/workbench/DebugToolbar.js';

export * from './components/dialog/ModalDialog.js';

export * from './conditions/WaitForAttribute.js';

/**
 * Initialize the page objects for your tests
 *
 * @param currentVersion version of the locators to load
 * @param baseVersion base version of the locators if you have multiple versions with diffs, otherwise leave the same as currentVersion
 * @param locatorFolder folder that contains locator files
 * @param driver WebDriver instance
 * @param browserID identifier/name of the browser (i.e. vscode)
 */
export function initPageObjects(currentVersion: string, baseVersion: string, locatorFolder: string, driver: WebDriver, browserID: string) {
	const locators = new LocatorLoader(currentVersion, baseVersion, locatorFolder).loadLocators();

	AbstractElement.init(locators, driver, browserID, currentVersion);
}
