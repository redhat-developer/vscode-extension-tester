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

import { Locators, ViewSection, fromAttribute, fromText, hasAttribute, hasClass, hasElement, hasNotClass } from '@redhat-developer/page-objects';
import { By, WebElement } from 'selenium-webdriver';

const abstractElement = {
	AbstractElement: {
		enabled: hasNotClass('disabled'),
		selected: hasAttribute('aria-selected', 'true'),
		tag: By.css('html'),
	},
};

const activityBar = {
	ActivityBar: {
		constructor: By.id('workbench.parts.activitybar'),
		viewContainer: By.xpath(`.//ul[@aria-label='Active View Switcher']`),
		label: 'aria-label',
		actionsContainer: By.xpath(`.//ul[@aria-label='Manage']`),
		actionItem: By.className('action-item'),
	},
	ViewControl: {
		attribute: 'class',
		klass: 'checked',
		scmId: By.id('workbench.view.scm'),
		debugId: By.id('workbench.view.debug'),
		badge: By.className('badge'),
	},
};

const bottomBar = {
	BottomBarPanel: {
		constructor: By.id('workbench.parts.panel'),
		problemsTab: 'Problems',
		outputTab: 'Output',
		debugTab: 'Debug Console',
		terminalTab: 'Terminal',
		maximize: 'Maximize Panel Size',
		restore: 'Restore Panel Size',
		close: 'Close Panel',
		tabContainer: By.className('panel-switcher-container'),
		tab: (title: string) => By.xpath(`.//li[starts-with(@title, '${title}')]`),
		actions: By.className('title-actions'),
		globalActions: By.className('title-actions'),
		action: (label: string) => By.xpath(`.//a[starts-with(@title, '${label}')]`),
		closeAction: By.className('codicon-panel-close'),
		openTabElement: (title: string) => By.xpath(`.//a[starts-with(@aria-label, '${title}')]`),
	},
	BottomBarViews: {
		actionsContainer: (label: string) => By.xpath(`.//ul[@aria-label='${label}']`),
		channelOption: By.css('option'),
		channelCombo: By.css('select'),
		channelText: By.className('option-text'),
		channelRow: By.className('monaco-list-row'),
		textArea: By.css('textarea'),
		clearText: By.className('clear-output'),
	},
	ProblemsView: {
		constructor: By.id('workbench.panel.markers'),
		markersFilter: By.className('markers-panel-action-filter'),
		input: By.css('input'),
		collapseAll: By.className('collapse-all'),
		markerRow: By.className('monaco-list-row'),
		rowLabel: 'aria-label',
		label: By.className('monaco-highlighted-label'),
		markerTwistie: By.className('monaco-tl-twistie'),
		changeCount: By.className('monaco-count-badge'),
	},
	TerminalView: {
		constructor: By.id('workbench.panel.terminal'),
		actionsLabel: 'Terminal actions',
		textArea: By.className('xterm-helper-textarea'),
		killTerminal: By.xpath(`.//a[@title='Kill Terminal']`),
		newTerminal: By.xpath(`.//a[starts-with(@title,'New Terminal')]`),
		tabList: By.className('tabs-list'),
		singleTab: By.className('single-terminal-tab'),
		selectedRow: By.className('monaco-list-row selected'),
		row: By.className('monaco-list-row'),
		newCommand: 'terminal: create new integrated terminal',
	},
	DebugConsoleView: {
		constructor: By.id('workbench.panel.repl'),
	},
	OutputView: {
		constructor: By.id('workbench.panel.output'),
		actionsLabel: 'Output actions',
		optionByName: (name: string) => By.xpath(`.//option[@value='${name}']`),
	},
	WebviewView: {
		iframe: By.xpath(`//div[not(@class)]/iframe[@class='webview ready' and not(@data-parent-flow-to-element-id)]`),
	},
};

const editor = {
	EditorView: {
		constructor: By.id('workbench.parts.editor'),
		editorGroup: By.className('editor-group-container'),
		settingsEditor: By.id('workbench.editor.settings2'),
		webView: By.id('WebviewEditor'),
		diffEditor: By.className('monaco-diff-editor'),
		tab: By.className('tab'),
		closeTab: By.className('tab-close'),
		tabTitle: 'title',
		tabSeparator: ', tab',
		tabLabel: 'aria-label',
		actionContainer: By.className('editor-actions'),
		actionItem: By.className('action-label'),
		attribute: 'title',
		dropdown: 'aria-haspopup',
	},
	Editor: {
		constructor: By.className('editor-instance'),
		inputArea: By.className('inputarea'),
		title: By.className('label-name'),
	},
	TextEditor: {
		activeTab: By.css('div.tab.active'),
		breakpoint: {
			pauseSelector: By.className('codicon-debug-stackframe'),
			generalSelector: By.className('codicon-debug-breakpoint'),
			properties: {
				enabled: hasNotClass('codicon-debug-breakpoint-unverified'),
				line: {
					selector: By.className('line-numbers'),
					number: (line: WebElement) => line.getText().then((line) => Number.parseInt(line)),
				},
				paused: hasClass('codicon-debug-stackframe'),
			},
		},
		editorContainer: By.className('monaco-editor'),
		dataUri: 'data-uri',
		formatDoc: 'Format Document',
		marginArea: By.className('margin-view-overlays'),
		lineNumber: (line: number) => By.xpath(`.//div[contains(@class, 'line-numbers') and text() = '${line}']`),
		lineOverlay: (line: number) => By.xpath(`.//div[contains(@class, 'line-numbers') and text() = '${line}']/..`),
		debugHint: By.className('codicon-debug-hint'),
		selection: By.className('cslr selected-text top-left-radius bottom-left-radius top-right-radius bottom-right-radius'),
		findWidget: By.className('find-widget'),
		shadowRootHost: By.className('shadow-root-host'),
		monacoMenuContainer: By.className('monaco-menu-container'),
		glyphMarginWidget: By.className('glyph-margin-widgets'),
		lineElement: (styleTopAttr: string) => By.xpath(`.//div[contains(@style, "${styleTopAttr}")]`),
		contentWidgets: By.className('contentWidgets'),
		contentWidgetsElements: By.xpath(`.//span[contains(@widgetid, 'codelens.widget')]/a[@id]`),
		elementLevelBack: By.xpath('./..'),
	},
	FindWidget: {
		toggleReplace: By.xpath(`.//div[@title="Toggle Replace mode"]`),
		replacePart: By.className('replace-part'),
		findPart: By.className('find-part'),
		matchCount: By.className('matchesCount'),
		input: By.css('textarea'),
		content: By.className('mirror'),
		button: (title: string) => By.xpath(`.//div[@role='button' and starts-with(@title, "${title}")]`),
		checkbox: (title: string) => By.xpath(`.//div[@role='checkbox' and starts-with(@title, "${title}")]`),
		nextMatch: 'Next match',
		previousMatch: 'Previous match',
		closePart: 'find',
	},
	ContentAssist: {
		constructor: By.className('suggest-widget'),
		message: By.className('message'),
		itemRows: By.className('monaco-list-rows'),
		itemRow: By.className('monaco-list-row'),
		itemLabel: By.className('label-name'),
		itemText: By.xpath(`./span/span`),
		itemList: By.className('monaco-list'),
		firstItem: By.xpath(`.//div[@data-index='0']`),
	},
	SettingsEditor: {
		title: 'Settings',
		itemRow: By.className('monaco-list-row'),
		header: By.className('settings-header'),
		tabs: By.className('settings-tabs-widget'),
		actions: By.className('actions-container'),
		action: (label: string) => By.xpath(`.//a[@title='${label}']`),
		settingConstructor: (title: string, category: string) =>
			By.xpath(`.//div[@class='monaco-tl-row' and .//span/text()='${title}' and .//span/text()='${category}: ']`),
		settingDescription: By.className('setting-item-description'),
		settingLabel: By.className('setting-item-label'),
		settingCategory: By.className('setting-item-category'),
		comboSetting: By.css('select'),
		comboOption: By.css('option'),
		comboValue: 'value',
		textSetting: By.css('input'),
		checkboxSetting: By.className('setting-value-checkbox'),
		checkboxChecked: 'aria-checked',
		linkButton: By.className('edit-in-settings-button'),
		itemCount: By.className('settings-count-widget'),
		arraySetting: By.className('setting-item-control'),
		arrayRoot: By.xpath(`.//div[@role='list' and contains(@class, 'setting-list-widget')]`),
		arrayRow: By.className('setting-list-row'),
		arrayRowValue: By.className('setting-list-value'),
		arrayNewRow: By.className('setting-list-new-row'),
		arrayEditRow: By.className('setting-list-edit-row'),
		arrayBtnConstructor: (label: string) => By.xpath(`.//a[contains(@role, 'button') and @aria-label='${label}']`),
		arraySettingItem: {
			btnConstructor: (label: string) => By.xpath(`.//a[contains(@role, 'button') and text()='${label}']`),
		},
		button: By.className('monaco-button'),
	},
	DiffEditor: {
		originalEditor: By.className('original-in-monaco-diff-editor'),
		modifiedEditor: By.className('modified-in-monaco-diff-editor'),
	},
	WebView: {
		iframe: By.css(`iframe[class='webview ready']`),
		activeFrame: By.id('active-frame'),
	},
	ExtensionEditorView: {
		constructor: By.className('extension-editor'),
		name: By.className('name'),
		version: By.className('version'),
		publisher: By.className('publisher-name'),
		description: By.className('description'),
		count: By.className('count'),
		navbar: By.className('navbar'),
		tab: By.className('action-label'),
		activeTab: By.xpath(`.//a[starts-with(@class, 'action-label checked')]`),
		specificTab: (tabname: string) => By.xpath(`.//a[starts-with(@class, 'action-label') and text()='${tabname}']`),
	},
	ExtensionEditorDetailsSection: {
		categoriesContainer: By.className('categories'),
		category: By.className('category'),
		resourcesContainer: By.className('resources'),
		resource: By.className('resource'),
		moreInfoContainer: By.className('more-info'),
		moreInfo: By.className('more-info-entry'),
		moreInfoElements: By.xpath('./*'),
	},
	EditorAction: {
		shadowRootHost: By.className('shadow-root-host'),
		monacoMenuContainer: By.className('monaco-menu-container'),
	},
};

const menu = {
	ContextMenu: {
		contextView: By.className('context-view'),
		constructor: By.className('monaco-menu-container'),
		itemConstructor: (label: string) => By.xpath(`.//li[a/span/@aria-label="${label}"]`),
		itemElement: By.className('action-item'),
		itemLabel: By.className('action-label'),
		itemText: 'aria-label',
		itemNesting: By.className('submenu-indicator'),
		viewBlock: By.className('context-view-block'),
	},
	TitleBar: {
		constructor: By.id('workbench.parts.titlebar'),
		itemConstructor: (label: string) => By.xpath(`.//div[@aria-label="${label}"]`),
		itemElement: By.className('menubar-menu-button'),
		itemLabel: 'aria-label',
		title: By.className('window-title'),
	},
	WindowControls: {
		constructor: By.className('window-controls-container'),
		minimize: By.className('window-minimize'),
		maximize: By.className('window-maximize'),
		restore: By.className('window-unmaximize'),
		close: By.className('window-close'),
	},
};

const sideBar = {
	SideBarView: {
		constructor: By.id('workbench.parts.sidebar'),
	},
	ViewTitlePart: {
		constructor: By.className('composite title'),
		title: By.css('h2'),
		action: By.className(`action-label`),
		actionLabel: 'title',
		actionConstructor: (title: string) => By.xpath(`.//a[@title='${title}']`),
	},
	ViewContent: {
		constructor: By.className('content'),
		progress: By.className('monaco-progress-container'),
		section: By.className('split-view-view'),
		defaultView: By.className('explorer-folders-view'),
		extensionsView: By.className('extensions-list'),
	},
	ViewSection: {
		title: By.className('title'),
		titleText: 'textContent',
		header: By.className('panel-header'),
		headerExpanded: 'aria-expanded',
		headerCollapseExpandButton: By.className('twisty-container'),
		actions: By.className('actions'),
		actionConstructor: (label: string) => By.xpath(`.//a[contains(@class, 'action-label') and @role='button' and @title='${label}']`),
		button: By.xpath(`.//a[@role='button']`),
		buttonLabel: 'title',
		level: 'aria-level',
		index: 'data-index',
		welcomeContent: By.className('welcome-view'),
		shadowRootHost: By.className('shadow-root-host'),
		monacoMenuContainer: By.className('monaco-menu-container'),
	},
	TreeItem: {
		actions: By.className('actions-container'),
		actionLabel: By.className('action-label'),
		actionTitle: 'title',
		twistie: By.className('monaco-tl-twistie'),
	},
	DefaultTreeSection: {
		itemRow: By.className('monaco-list-row'),
		itemLabel: 'aria-label',
		rowContainer: By.className('monaco-list'),
		rowWithLabel: (label: string) => By.xpath(`.//div[@role='treeitem' and @aria-label='${label}']`),
		lastRow: By.xpath(`.//div[@data-last-element='true']`),
		type: {
			default: hasElement((locators: Locators) => locators.ViewContent.defaultView),
			marketplace: {
				extension: hasElement((locators: Locators) => locators.ViewContent.extensionsView),
			},
		},
	},
	DefaultTreeItem: {
		ctor: (label: string) => By.xpath(`.//div[@role='treeitem' and @aria-label='${label}']`),
		twistie: By.className('monaco-tl-twistie'),
		tooltip: By.className('explorer-item'),
		labelAttribute: 'title',
	},
	CustomTreeSection: {
		itemRow: By.className('monaco-list-row'),
		itemLabel: By.className('monaco-highlighted-label'),
		rowContainer: By.className('monaco-list'),
		rowWithLabel: (label: string) => By.xpath(`.//span[text()='${label}']`),
	},
	CustomTreeItem: {
		constructor: (label: string) => By.xpath(`.//div[@role='treeitem' and .//span[text()='${label}']]`),
		tooltipAttribute: 'aria-label',
		expandedAttr: 'aria-expanded',
		expandedValue: 'true',
		description: By.className('label-description'),
	},
	DebugBreakpointSection: {
		predicate: async (section: ViewSection) => (await section.getTitle()).toLowerCase() === 'breakpoints',
	},
	BreakpointSectionItem: {
		breakpoint: {
			constructor: By.className('codicon'),
		},
		breakpointCheckbox: {
			constructor: By.css('input[type=checkbox'),
			value: (el: WebElement) => el.isSelected(),
		},
		label: {
			constructor: By.className('name'),
			value: fromText(),
		},
		filePath: {
			constructor: By.className('file-path'),
			value: fromText(),
		},
		lineNumber: {
			constructor: By.className('line-number'),
			value: fromText(),
		},
	},
	DebugVariableSection: {
		predicate: async (section: ViewSection) => (await section.getTitle()).toLowerCase() === 'variables',
	},
	VariableSectionItem: {
		label: fromText(By.className('monaco-highlighted-label')),
		name: {
			constructor: By.className('name'),
			value: fromText(),
			tooltip: fromAttribute('title', By.className('monaco-highlighted-label')),
		},
		value: {
			constructor: By.className('value'),
			value: fromText(),
			tooltip: fromAttribute('title'),
		},
	},
	DebugCallStackSection: {
		predicate: async (section: ViewSection) => (await section.getTitle()).toLowerCase() === 'call stack',
	},
	CallStackItem: {
		label: By.className('monaco-highlighted-label'),
		text: By.className('state label monaco-count-badge long'),
	},
	WatchSection: {
		predicate: async (section: ViewSection) => (await section.getTitle()).toLowerCase() === 'watch',
		input: By.css('input'),
		addExpression: 'Add Expression',
		refresh: 'Refresh',
		removeAll: 'Remove All Expressions',
		collapseAll: 'Collapse All',
	},
	WatchSectionItem: {
		label: By.className('monaco-highlighted-label'),
		value: By.xpath(`.//*[contains(@class, 'value ') and starts-with(@class, 'value ')]`),
		remove: 'Remove Expression',
	},
	ExtensionsViewSection: {
		items: By.className('monaco-list-rows'),
		itemRow: By.className('monaco-list-row'),
		itemTitle: By.className('name'),
		searchBox: By.className('inputarea'),
		textContainer: By.className('view-line'),
		textField: By.className('mtk1'),
	},
	ExtensionsViewItem: {
		version: By.className('version'),
		author: By.className('author'),
		description: By.className('description'),
		install: By.className('install'),
		manage: By.className('manage'),
	},
	ScmView: {
		providerHeader: By.css(`div[class*='panel-header scm-provider']`),
		providerRelative: By.xpath(`./..`),
		initButton: By.xpath(`.//a[text()='Initialize Repository']`),
		providerTitle: By.className('title'),
		providerType: By.className('type'),
		action: By.className('action-label'),
		actionConstructor: (title: string) => By.xpath(`.//a[@title='${title}']`),
		actionLabel: 'title',
		inputField: By.css('textarea'),
		changeItem: By.xpath(`.//div[@role='treeitem']`),
		changeName: By.className('name'),
		changeCount: By.className('monaco-count-badge'),
		changeLabel: By.className('label-name'),
		changeDesc: By.className('label-description'),
		resource: By.className('resource'),
		changes: By.xpath(`.//div[@role="treeitem" and .//div/text()="CHANGES"]`),
		stagedChanges: By.xpath(`.//div[@role="treeitem" and .//div/text()="STAGED CHANGES"]`),
		expand: By.className('monaco-tl-twistie'),
		more: By.className('toolbar-toggle-more'),
		multiMore: By.className('codicon-toolbar-more'),
		multiScmProvider: By.className('scm-provider'),
		singleScmProvider: By.className(`scm-view`),
		multiProviderItem: By.xpath(`.//div[@role='treeitem' and @aria-level='1']`),
		itemLevel: (level: number) => By.xpath(`.//div[@role='treeitem' and @aria-level='${level}']`),
		itemIndex: (index: number) => By.xpath(`.//div[@role='treeitem' and @data-index='${index}']`),
		shadowRootHost: By.className('shadow-root-host'),
		monacoMenuContainer: By.className('monaco-menu-container'),
		sourceControlSection: By.xpath(`.//div[@aria-label='Source Control Section']`),
	},
	DebugView: {
		launchCombo: By.className('start-debug-action-item'),
		launchSelect: By.css('select'),
		launchOption: By.css('option'),
		optionByName: (name: string) => By.xpath(`.//option[@value='${name}']`),
		startButton: By.className('codicon-debug-start'),
	},
};

const statusBar = {
	StatusBar: {
		constructor: By.id('workbench.parts.statusbar'),
		language: By.id('status.editor.mode'),
		lines: By.id('status.editor.eol'),
		encoding: By.id('status.editor.encoding'),
		indent: By.id('status.editor.indentation'),
		selection: By.id('status.editor.selection'),
		notifications: By.className('notifications-center'),
		bell: By.id('status.notifications'),
		item: By.className('statusbar-item'),
		itemTitle: 'aria-label',
		aTag: By.css('a'),
	},
};

const workbench = {
	Workbench: {
		constructor: By.className('monaco-workbench'),
		notificationContainer: By.className('notification-toast-container'),
		notificationItem: By.className('monaco-list-row'),
	},
	Notification: {
		message: By.className('notification-list-item-message'),
		icon: By.className('notification-list-item-icon'),
		source: By.className('notification-list-item-source'),
		progress: By.className('monaco-progress-container'),
		dismiss: By.className('clear-notification-action'),
		expand: By.className('codicon-notifications-expand'),
		actions: By.className('notification-list-item-buttons-container'),
		action: By.className('monaco-button'),
		actionLabel: {
			value: fromAttribute('title'),
		},
		standalone: (id: string) => By.xpath(`.//div[contains(@class, 'monaco-list-row') and @id='${id}']`),
		standaloneContainer: By.className('notifications-toasts'),
		center: (index: number) => By.xpath(`.//div[contains(@class, 'monaco-list-row') and @data-index='${index}']`),
		buttonConstructor: (title: string) => By.xpath(`.//a[@role='button' and @title='${title}']`),
	},
	NotificationsCenter: {
		constructor: By.className('notifications-center'),
		close: By.className('hide-all-notifications-action'),
		clear: By.className('clear-all-notifications-action'),
		row: By.className('monaco-list-row'),
	},
	DebugToolbar: {
		ctor: By.className('debug-toolbar'),
		button: (title: string) => By.className(`codicon-debug-${title}`),
	},
};

const input = {
	Input: {
		inputBox: By.className('monaco-inputbox'),
		input: By.className('input'),
		quickPickIndex: (index: number) => By.xpath(`.//div[@role='treeitem' and @data-index='${index}']`),
		quickPickPosition: (index: number) => By.xpath(`.//div[@role='treeitem' and @aria-posinset='${index}']`),
		quickPickLabel: By.className('label-name'),
		quickPickDescription: By.className('label-description'),
		quickPickSelectAll: By.className('quick-input-check-all'),
		quickPickIsSelected: 'aria-checked',
		titleBar: By.className('quick-input-titlebar'),
		title: By.className('quick-input-title'),
		backButton: By.className('codicon-quick-input-back'),
		multiSelectIndex: (index: number) => By.xpath(`.//div[@role='treeitem' and @data-index='${index}']`),
		button: By.xpath(`.//a[@role='button']`),
		buttonLabel: 'title',
	},
	InputBox: {
		constructor: By.className('quick-input-widget'),
		message: By.className('quick-input-message'),
		progress: By.className('quick-input-progress'),
		quickList: By.className('quick-input-list'),
		rows: By.className('monaco-list-rows'),
		row: By.className('monaco-list-row'),
	},
	QuickOpenBox: {
		constructor: By.className('monaco-quick-open-widget'),
		progress: By.className('monaco-progress-container'),
		quickList: By.className('quick-open-tree'),
		row: By.xpath(`.//div[@role='treeitem']`),
	},
};

const dialog = {
	Dialog: {
		constructor: By.className('monaco-dialog-box'),
		message: By.className('dialog-message-text'),
		details: By.className('dialog-message-detail'),
		buttonContainer: By.className('dialog-buttons-row'),
		button: By.className('monaco-text-button'),
		closeButton: By.className('codicon-dialog-close'),
		buttonLabel: {
			value: fromAttribute('title'),
		},
	},
};

const welcomeContentButtonSelector = ".//a[@class='monaco-button monaco-text-button']";
const welcomeContentTextSelector = './/p';

const welcome = {
	WelcomeContent: {
		button: By.xpath(welcomeContentButtonSelector),
		buttonOrText: By.xpath(`${welcomeContentButtonSelector} | ${welcomeContentTextSelector}`),
		text: By.xpath(welcomeContentTextSelector),
	},
};

/**
 * All available locators for vscode version 1.37.0
 */
export const locators: Locators = {
	...abstractElement,
	...activityBar,
	...bottomBar,
	...editor,
	...menu,
	...sideBar,
	...statusBar,
	...workbench,
	...input,
	...dialog,
	...welcome,
};
