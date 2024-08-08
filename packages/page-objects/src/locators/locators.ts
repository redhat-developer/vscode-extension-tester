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

import { By, WebElement } from 'selenium-webdriver';
import { PartialDeep } from 'type-fest';
import { ViewSection } from '../components/sidebar/ViewSection';

type WebElementFunction<E extends WebElement, T> = (element: E) => T | PromiseLike<T>;
type LocatorAwareWebElementFunction<T> = (element: WebElement, locator: Locators) => T | PromiseLike<T>;

/**
 * Type definitions for all used locators
 */
export interface Locators {
	// AbstractElement properties
	AbstractElement: {
		enabled: WebElementFunction<WebElement, boolean>;
		selected: WebElementFunction<WebElement, boolean>;
	};

	// Activity Bar
	ActivityBar: {
		constructor: By;
		viewContainer: By;
		label: string;
		actionsContainer: By;
		actionItem: By;
	};
	ViewControl: {
		attribute: string;
		klass: string;
		scmId: By;
		debugId: By;
		badge: By;
	};

	// Bottom Bar
	BottomBarPanel: {
		constructor: By;
		problemsTab: string;
		outputTab: string;
		debugTab: string;
		terminalTab: string;
		maximize: string;
		restore: string;
		close: string;
		tabContainer: By;
		tab: (title: string) => By;
		actions: By;
		globalActions: By;
		action: (label: string) => By;
		closeAction: By;
	};
	BottomBarViews: {
		actionsContainer: (label: string) => By;
		channelOption: By;
		channelCombo: By;
		channelText: By;
		channelRow: By;
		textArea: By;
		clearText: By;
	};
	ProblemsView: {
		constructor: By;
		markersFilter: By;
		input: By;
		collapseAll: By;
		markerRow: By;
		rowLabel: string;
		label: By;
		markerTwistie: By;
		changeCount: By;
	};
	TerminalView: {
		constructor: By;
		actionsLabel: string;
		textArea: By;
		killTerminal: By;
		newTerminal: By;
		tabList: By;
		singleTab: By;
		selectedRow: By;
		row: By;
		newCommand: string;
	};
	DebugConsoleView: {
		constructor: By;
	};
	OutputView: {
		constructor: By;
		actionsLabel: string;
		optionByName: (name: string) => By;
	};
	WebviewView: {
		iframe: By;
	};

	// Editors
	EditorView: {
		constructor: By;
		editorGroup: By;
		settingsEditor: By;
		webView: By;
		diffEditor: By;
		tab: By;
		closeTab: By;
		tabTitle: string;
		tabSeparator: string;
		tabLabel: string;
		actionContainer: By;
		actionItem: By;
		attribute: string;
		dropdown: string;
	};
	Editor: {
		constructor: By;
		inputArea: By;
		title: By;
	};
	TextEditor: {
		activeTab: By;
		breakpoint: {
			pauseSelector: By;
			generalSelector: By;
			properties: {
				enabled: WebElementFunction<WebElement, boolean>;
				line: {
					selector: By;
					number: WebElementFunction<WebElement, number>;
				};
				paused: WebElementFunction<WebElement, boolean>;
			};
		};
		editorContainer: By;
		dataUri: string;
		formatDoc: string;
		marginArea: By;
		lineNumber: (line: number) => By;
		lineOverlay: (line: number) => By;
		debugHint: By;
		selection: By;
		findWidget: By;
	};
	FindWidget: {
		toggleReplace: By;
		replacePart: By;
		findPart: By;
		matchCount: By;
		input: By;
		content: By;
		button: (title: string) => By;
		checkbox: (title: string) => By;
	};
	ContentAssist: {
		constructor: By;
		message: By;
		itemRows: By;
		itemRow: By;
		itemLabel: By;
		itemText: By;
		itemList: By;
		firstItem: By;
	};
	SettingsEditor: {
		title: string;
		itemRow: By;
		header: By;
		tabs: By;
		actions: By;
		action: (label: string) => By;
		settingConstructor: (title: string, category: string) => By;
		settingDescription: By;
		settingLabel: By;
		settingCategory: By;
		comboSetting: By;
		comboOption: By;
		comboValue: string;
		textSetting: By;
		checkboxSetting: By;
		checkboxChecked: string;
		linkButton: By;
		itemCount: By;
		arraySetting: By;
		arrayRoot: By;
		arrayRow: By;
		arrayRowValue: By;
		arrayNewRow: By;
		arrayEditRow: By;
		arrayBtnConstructor: (label: string) => By;
		arraySettingItem: {
			btnConstructor: (label: string) => By;
		};
	};
	DiffEditor: {
		originalEditor: By;
		modifiedEditor: By;
	};
	WebView: {
		iframe: By;
		activeFrame: By;
		container: (id: string) => By;
		attribute: string;
	};

	// Menus
	ContextMenu: {
		contextView: By;
		constructor: By;
		itemConstructor: (label: string) => By;
		itemElement: By;
		itemLabel: By;
		itemText: string;
		itemNesting: By;
		viewBlock: By;
	};
	TitleBar: {
		constructor: By;
		itemConstructor: (label: string) => By;
		itemElement: By;
		itemLabel: string;
		title: By;
	};
	WindowControls: {
		constructor: By;
		minimize: By;
		maximize: By;
		restore: By;
		close: By;
	};

	// Side Bar
	SideBarView: {
		constructor: By;
	};
	ViewTitlePart: {
		constructor: By;
		title: By;
		action: By;
		actionLabel: string;
		actionConstructor: (title: string) => By;
	};
	ViewContent: {
		constructor: By;
		progress: By;
		section: By;
		defaultView: By;
		extensionsView: By;
	};
	ViewSection: {
		title: By;
		titleText: string;
		header: By;
		headerExpanded: string;
		actions: By;
		actionConstructor: (label: string) => By;
		button: By;
		buttonLabel: string;
		level: string;
		index: string;
		welcomeContent: By;
	};
	TreeItem: {
		actions: By;
		actionLabel: By;
		actionTitle: string;
		twistie: By;
	};
	DefaultTreeSection: {
		itemRow: By;
		itemLabel: string;
		rowContainer: By;
		rowWithLabel: (label: string) => By;
		lastRow: By;
		type: {
			default: LocatorAwareWebElementFunction<boolean>;
			marketplace: {
				extension: LocatorAwareWebElementFunction<boolean>;
			};
		};
	};
	DefaultTreeItem: {
		ctor: (label: string) => By;
		twistie: By;
		tooltip: By;
		labelAttribute: string;
	};
	CustomTreeSection: {
		itemRow: By;
		itemLabel: By;
		rowContainer: By;
		rowWithLabel: (label: string) => By;
	};
	CustomTreeItem: {
		constructor: (label: string) => By;
		expandedAttr: string;
		expandedValue: string;
		tooltipAttribute: string;
		description: By;
	};
	DebugBreakpointSection: {
		predicate: WebElementFunction<ViewSection, boolean>;
	};
	BreakpointSectionItem: {
		breakpoint: {
			constructor: By;
		};
		breakpointCheckbox: {
			constructor: By;
			value: WebElementFunction<WebElement, boolean>;
		};
		label: {
			constructor: By;
			value: WebElementFunction<WebElement, string>;
		};
		filePath: {
			constructor: By;
			value: WebElementFunction<WebElement, string>;
		};
		lineNumber: {
			constructor: By;
			value: WebElementFunction<WebElement, string>;
		};
	};
	DebugVariableSection: {
		predicate: WebElementFunction<ViewSection, boolean>;
	};
	VariableSectionItem: {
		label: WebElementFunction<WebElement, string>;
		name: {
			constructor: By;
			value: WebElementFunction<WebElement, string>;
			tooltip: WebElementFunction<WebElement, string>;
		};
		value: {
			constructor: By;
			value: WebElementFunction<WebElement, string>;
			tooltip: WebElementFunction<WebElement, string>;
		};
	};
	DebugCallStackSection: {
		predicate: WebElementFunction<ViewSection, boolean>;
	};
	CallStackItem: {
		label: By;
		text: By;
	};
	ExtensionsViewSection: {
		items: By;
		itemRow: By;
		itemTitle: By;
		searchBox: By;
		textContainer: By;
		textField: By;
	};
	ExtensionsViewItem: {
		version: By;
		author: By;
		description: By;
		install: By;
		manage: By;
	};
	ScmView: {
		providerHeader: By;
		providerRelative: By;
		initButton: By;
		providerTitle: By;
		providerType: By;
		action: By;
		actionConstructor: (title: string) => By;
		actionLabel: string;
		inputField: By;
		changeItem: By;
		changeName: By;
		changeCount: By;
		changeLabel: By;
		changeDesc: By;
		resource: By;
		changes: By;
		stagedChanges: By;
		expand: By;
		more: By;
		multiMore: By;
		multiScmProvider: By;
		singleScmProvider: By;
		multiProviderItem: By;
		itemLevel: (level: number) => By;
		itemIndex: (index: number) => By;
	};
	DebugView: {
		launchCombo: By;
		launchSelect: By;
		launchOption: By;
		optionByName: (name: string) => By;
		startButton: By;
	};
	DebugToolbar: {
		ctor: By;
		button: (title: string) => By;
	};

	// Status Bar
	StatusBar: {
		constructor: By;
		language: By;
		lines: By;
		encoding: By;
		indent: By;
		selection: By;
		notifications: By;
		bell: By;
		item: By;
		itemTitle: string;
	};

	// Workbench
	Workbench: {
		constructor: By;
		notificationContainer: By;
		notificationItem: By;
	};
	Notification: {
		message: By;
		icon: By;
		source: By;
		progress: By;
		dismiss: By;
		expand: By;
		actions: By;
		action: By;
		actionLabel: {
			value: WebElementFunction<WebElement, string>;
		};
		standalone: (id: string) => By;
		standaloneContainer: By;
		center: (index: number) => By;
		buttonConstructor: (title: string) => By;
	};
	NotificationsCenter: {
		constructor: By;
		close: By;
		clear: By;
		row: By;
	};

	// Inputs
	Input: {
		inputBox: By;
		input: By;
		quickPickIndex: (index: number) => By;
		quickPickPosition: (index: number) => By;
		quickPickLabel: By;
		quickPickDescription: By;
		quickPickSelectAll: By;
		quickPickIsSelected: string;
		titleBar: By;
		title: By;
		backButton: By;
		multiSelectIndex: (index: number) => By;
	};
	InputBox: {
		constructor: By;
		message: By;
		progress: By;
		quickList: By;
		rows: By;
		row: By;
	};
	QuickOpenBox: {
		constructor: By;
		progress: By;
		quickList: By;
		row: By;
	};

	// Dialogs
	Dialog: {
		constructor: By;
		message: By;
		details: By;
		buttonContainer: By;
		button: By;
		closeButton: By;
		buttonLabel: {
			value: WebElementFunction<WebElement, string>;
		};
	};

	WelcomeContent: {
		button: By;
		text: By;
		buttonOrText: By;
	};
}

/**
 * Definition for locator diff object
 */
export interface LocatorDiff {
	locators: PartialDeep<Locators>;
	extras?: object;
}

export function hasAttribute(attr: string, value?: string, locator?: By): (el: WebElement) => Promise<boolean> {
	return async (el: WebElement) => {
		el = locator ? el.findElement(locator) : el;
		const attrValue = await el.getAttribute(attr);
		if (value === undefined) {
			return attrValue !== null;
		}
		return attrValue === value;
	};
}

export function hasClass(classOrPredicate: string | ((klass: string) => boolean), locator?: By): (el: WebElement) => Promise<boolean> {
	return async (el: WebElement) => {
		el = locator ? el.findElement(locator) : el;
		const klasses = await el.getAttribute('class');
		const segments = klasses?.split(/\s+/g);
		const predicate = typeof classOrPredicate === 'string' ? (klass: string) => klass === classOrPredicate : classOrPredicate;
		return segments.find(predicate) !== undefined;
	};
}

export function hasNotClass(klass: string, locator?: By): (el: WebElement) => Promise<boolean> {
	return async (el: WebElement) => {
		el = locator ? el.findElement(locator) : el;
		return !(await hasClass(klass).call(undefined, el));
	};
}

export function hasElement(locatorSelector: (l: Locators) => By): (el: WebElement, locators: Locators) => Promise<boolean> {
	return async (el: WebElement, locators: Locators) => {
		return (await el.findElements(locatorSelector(locators))).length > 0;
	};
}

export function fromAttribute(attribute: string, locator?: By): (el: WebElement) => Promise<string> {
	return async (el: WebElement) => {
		el = locator ? el.findElement(locator) : el;
		return el.getAttribute(attribute);
	};
}

export function fromText(locator?: By): (el: WebElement) => Promise<string> {
	return async (el: WebElement) => {
		el = locator ? el.findElement(locator) : el;
		return el.getText();
	};
}
