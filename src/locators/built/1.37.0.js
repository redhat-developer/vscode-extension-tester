"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const selenium_webdriver_1 = require("selenium-webdriver");
const activityBar = {
    ActionsControl: {
        constructor: (title) => selenium_webdriver_1.By.xpath(`.//li[@aria-label='${title}']`)
    },
    ActivityBar: {
        constructor: selenium_webdriver_1.By.id('workbench.parts.activitybar'),
        viewContainer: selenium_webdriver_1.By.xpath(`.//ul[@aria-label='Active View Switcher']`),
        label: 'aria-label',
        actionsContainer: selenium_webdriver_1.By.className('actions-container'),
        actionItem: selenium_webdriver_1.By.className('action-item')
    },
    ViewControl: {
        constructor: (title) => selenium_webdriver_1.By.xpath(`.//li[contains(@aria-label, '${title}')]`),
        attribute: 'class',
        klass: 'checked'
    }
};
const bottomBar = {
    BottomBarPanel: {
        constructor: selenium_webdriver_1.By.id('workbench.parts.panel'),
        problemsTab: 'Problems',
        outputTab: 'Output',
        debugTab: 'Debug Console',
        terminalTab: 'Terminal',
        maximize: 'Maximize Panel Size',
        restore: 'Restore Panel Size',
        tabContainer: selenium_webdriver_1.By.className('panel-switcher-container'),
        tab: (title) => selenium_webdriver_1.By.xpath(`.//li[starts-with(@title, '${title}')]`),
        actions: selenium_webdriver_1.By.className('title-actions'),
        action: (label) => selenium_webdriver_1.By.xpath(`.//a[starts-with(@title, '${label}')]`)
    },
    BottomBarViews: {
        actionsContainer: (label) => selenium_webdriver_1.By.xpath(`.//ul[@aria-label='${label}']`),
        channelOption: selenium_webdriver_1.By.tagName('option'),
        channelCombo: selenium_webdriver_1.By.tagName('select'),
        channelText: selenium_webdriver_1.By.className('option-text'),
        channelRow: selenium_webdriver_1.By.className('monaco-list-row'),
        textArea: selenium_webdriver_1.By.tagName('textarea'),
        clearText: selenium_webdriver_1.By.className('clear-output')
    },
    ProblemsView: {
        constructor: selenium_webdriver_1.By.id('workbench.panel.markers'),
        markersFilter: selenium_webdriver_1.By.className('markers-panel-action-filter'),
        input: selenium_webdriver_1.By.tagName('input'),
        collapseAll: selenium_webdriver_1.By.className('collapse-all'),
        markerRow: selenium_webdriver_1.By.className('monaco-list-row'),
        rowLabel: 'aria-label',
        markerTwistie: selenium_webdriver_1.By.className('monaco-tl-twistie')
    },
    TerminalView: {
        constructor: selenium_webdriver_1.By.id('workbench.panel.terminal'),
        actionsLabel: 'Terminal actions',
        textArea: selenium_webdriver_1.By.className('xterm-helper-textarea'),
        killTerminal: selenium_webdriver_1.By.xpath(`.//a[@title='Kill Terminal']`),
        newTerminal: selenium_webdriver_1.By.xpath(`.//a[starts-with(@title,'New Terminal')]`)
    },
    DebugConsoleView: {
        constructor: selenium_webdriver_1.By.id('workbench.panel.repl')
    },
    OutputView: {
        constructor: selenium_webdriver_1.By.id('workbench.panel.output'),
        actionsLabel: 'Output actions'
    }
};
const editor = {
    EditorView: {
        constructor: selenium_webdriver_1.By.id('workbench.parts.editor'),
        editorGroup: selenium_webdriver_1.By.className('editor-group-container'),
        settingsEditor: selenium_webdriver_1.By.id('workbench.editor.settings2'),
        webView: selenium_webdriver_1.By.id('WebviewEditor'),
        diffEditor: selenium_webdriver_1.By.className('monaco-diff-editor'),
        tab: selenium_webdriver_1.By.className('tab'),
        closeTab: selenium_webdriver_1.By.className('tab-close'),
        tabTitle: 'title',
        tabLabel: 'aria-label'
    },
    Editor: {
        constructor: selenium_webdriver_1.By.className('editor-instance'),
        inputArea: selenium_webdriver_1.By.className('inputarea')
    },
    TextEditor: {
        activeTab: selenium_webdriver_1.By.css('div.tab.active'),
        editorContainer: selenium_webdriver_1.By.className('monaco-editor'),
        dataUri: 'data-uri',
        formatDoc: 'Format Document'
    },
    ContentAssist: {
        constructor: selenium_webdriver_1.By.className('suggest-widget'),
        message: selenium_webdriver_1.By.className('message'),
        itemRows: selenium_webdriver_1.By.className('monaco-list-rows'),
        itemRow: selenium_webdriver_1.By.className('monaco-list-row'),
        itemLabel: selenium_webdriver_1.By.className('label-name'),
        itemText: selenium_webdriver_1.By.xpath(`./span/span`)
    },
    SettingsEditor: {
        title: 'Settings',
        itemRow: selenium_webdriver_1.By.className('monaco-list-row'),
        header: selenium_webdriver_1.By.className('settings-header'),
        tabs: selenium_webdriver_1.By.className('settings-tabs-widget'),
        actions: selenium_webdriver_1.By.className('actions-container'),
        action: (label) => selenium_webdriver_1.By.xpath(`.//a[@title='${label}']`),
        settingConstructor: (title, category) => selenium_webdriver_1.By.xpath(`.//div[@class='monaco-tl-row' and .//span/text()='${title}' and .//span/text()='${category}: ']`),
        settingDesctiption: selenium_webdriver_1.By.className('setting-item-description'),
        comboSetting: selenium_webdriver_1.By.tagName('select'),
        comboOption: selenium_webdriver_1.By.className('option-text'),
        textSetting: selenium_webdriver_1.By.tagName('input'),
        checkboxSetting: selenium_webdriver_1.By.className('setting-value-checkbox'),
        checkboxChecked: 'aria-checked',
        linkButton: selenium_webdriver_1.By.className('edit-in-settings-button')
    },
    DiffEditor: {
        originalEditor: selenium_webdriver_1.By.className('original-in-monaco-diff-editor'),
        modifiedEditor: selenium_webdriver_1.By.className('modified-in-monaco-diff-editor')
    }
};
const menu = {
    ContextMenu: {
        contextView: selenium_webdriver_1.By.className('context-view'),
        constructor: selenium_webdriver_1.By.className('monaco-menu-container'),
        itemConstructor: (label) => selenium_webdriver_1.By.xpath(`.//li[a/span/@aria-label='${label}']`),
        itemElement: selenium_webdriver_1.By.className('action-item'),
        itemLabel: selenium_webdriver_1.By.className('action-label'),
        itemText: 'aria-label',
        itemNesting: selenium_webdriver_1.By.className('submenu-indicator')
    },
    TitleBar: {
        constructor: selenium_webdriver_1.By.id('workbench.parts.titlebar'),
        itemConstructor: (label) => selenium_webdriver_1.By.xpath(`.//div[@aria-label='${label}']`),
        itemElement: selenium_webdriver_1.By.className('menubar-menu-button'),
        itemLabel: 'aria-label',
        title: selenium_webdriver_1.By.className('window-title')
    },
    WindowControls: {
        constructor: selenium_webdriver_1.By.className('window-controls-container'),
        minimize: selenium_webdriver_1.By.className('window-minimize'),
        maximize: selenium_webdriver_1.By.className('window-maximize'),
        restore: selenium_webdriver_1.By.className('window-unmaximize'),
        close: selenium_webdriver_1.By.className('window-close')
    }
};
const sideBar = {
    SideBarView: {
        constructor: selenium_webdriver_1.By.id('workbench.parts.sidebar')
    },
    ViewTitlePart: {
        constructor: selenium_webdriver_1.By.className('composite title'),
        title: selenium_webdriver_1.By.tagName('h2'),
        action: selenium_webdriver_1.By.className(`action-label`),
        actionLabel: 'title',
        actionContstructor: (title) => selenium_webdriver_1.By.xpath(`.//a[@title='${title}']`)
    },
    ViewContent: {
        constructor: selenium_webdriver_1.By.className('content'),
        progress: selenium_webdriver_1.By.className('monaco-progress-container'),
        section: selenium_webdriver_1.By.className('split-view-view'),
        sectionTitle: selenium_webdriver_1.By.className('title'),
        sectionText: 'textContent',
        defaultView: selenium_webdriver_1.By.className('explorer-folders-view'),
        extensionsView: selenium_webdriver_1.By.className('extensions-list')
    },
    ViewSection: {
        title: selenium_webdriver_1.By.className('title'),
        titleText: 'textContent',
        header: selenium_webdriver_1.By.className('panel-header'),
        headerExpanded: 'aria-expanded',
        actions: selenium_webdriver_1.By.className('actions'),
        actionConstructor: (label) => selenium_webdriver_1.By.xpath(`.//a[contains(@class, 'action-label') and @role='button' and @title='${label}']`),
        button: selenium_webdriver_1.By.xpath(`.//a[@role='button']`),
        buttonLabel: 'title',
        level: 'aria-level'
    },
    TreeItem: {
        actions: selenium_webdriver_1.By.className('actions-container'),
        actionLabel: selenium_webdriver_1.By.className('action-label'),
        actionTitle: 'title'
    },
    DefaultTreeSection: {
        itemRow: selenium_webdriver_1.By.className('monaco-list-row'),
        itemLabel: 'aria-label',
        rowContainer: selenium_webdriver_1.By.className('monaco-list'),
        rowWithLabel: (label) => selenium_webdriver_1.By.xpath(`.//div[contains(@class, 'monaco-list-row') and @aria-label='${label}']`),
        lastRow: selenium_webdriver_1.By.xpath(`.//div[@data-last-element='true']`)
    },
    DefaultTreeItem: {
        constructor: (label) => selenium_webdriver_1.By.xpath(`.//div[@role='treeitem' and @aria-label='${label}']`),
        twistie: selenium_webdriver_1.By.className('monaco-tl-twistie')
    },
    CustomTreeSection: {
        itemRow: selenium_webdriver_1.By.className('monaco-list-row'),
        itemLabel: selenium_webdriver_1.By.className('monaco-highlighted-label'),
        rowContainer: selenium_webdriver_1.By.className('monaco-list'),
        rowWithLabel: (label) => selenium_webdriver_1.By.xpath(`.//span[contains(text(), '${label}')]`)
    },
    CustomTreeItem: {
        constructor: (label) => selenium_webdriver_1.By.xpath(`.//div[@role='treeitem' and .//span[text()='${label}']]`),
        expandedAttr: 'aria-expanded',
        expandedValue: 'true'
    },
    ExtensionsViewSection: {
        items: selenium_webdriver_1.By.className('monaco-list-rows'),
        itemRow: selenium_webdriver_1.By.className('monaco-list-row'),
        itemTitle: selenium_webdriver_1.By.className('name'),
        searchBox: selenium_webdriver_1.By.className('inputarea'),
        textContainer: selenium_webdriver_1.By.className('view-line'),
        textField: selenium_webdriver_1.By.className('mtk1')
    },
    ExtensionsViewItem: {
        version: selenium_webdriver_1.By.className('version'),
        author: selenium_webdriver_1.By.className('author'),
        description: selenium_webdriver_1.By.className('description'),
        install: selenium_webdriver_1.By.className('install'),
        manage: selenium_webdriver_1.By.className('manage')
    }
};
const statusBar = {
    StatusBar: {
        constructor: selenium_webdriver_1.By.id('workbench.parts.statusbar'),
        language: selenium_webdriver_1.By.id('status.editor.mode'),
        lines: selenium_webdriver_1.By.id('status.editor.eol'),
        encoding: selenium_webdriver_1.By.id('status.editor.encoding'),
        indent: selenium_webdriver_1.By.id('status.editor.indentation'),
        selection: selenium_webdriver_1.By.id('status.editor.selection'),
        notifications: selenium_webdriver_1.By.className('notifications-center'),
        bell: selenium_webdriver_1.By.id('status.notifications')
    }
};
const workbench = {
    Workbench: {
        constructor: selenium_webdriver_1.By.className('monaco-workbench'),
        notificationContainer: selenium_webdriver_1.By.className('notification-toast-container'),
        notificationItem: selenium_webdriver_1.By.className('monaco-list-row')
    },
    Notification: {
        message: selenium_webdriver_1.By.className('notification-list-item-message'),
        icon: selenium_webdriver_1.By.className('notification-list-item-icon'),
        source: selenium_webdriver_1.By.className('notification-list-item-source'),
        progress: selenium_webdriver_1.By.className('monaco-progress-container'),
        dismiss: selenium_webdriver_1.By.className('clear-notification-action'),
        actions: selenium_webdriver_1.By.className('notification-list-item-buttons-container'),
        action: selenium_webdriver_1.By.className('monaco-button'),
        actionLabel: 'title',
        standalone: (id) => selenium_webdriver_1.By.xpath(`.//div[contains(@class, 'monaco-list-row') and @id='${id}']`),
        standaloneContainer: selenium_webdriver_1.By.className('notifications-toasts'),
        center: (index) => selenium_webdriver_1.By.xpath(`.//div[contains(@class, 'monaco-list-row') and @data-index='${index}']`),
        buttonConstructor: (title) => selenium_webdriver_1.By.xpath(`.//a[@role='button' and @title='${title}']`)
    },
    NotificationsCenter: {
        constructor: selenium_webdriver_1.By.className('notifications-center'),
        close: selenium_webdriver_1.By.className('hide-all-notifications-action'),
        clear: selenium_webdriver_1.By.className('clear-all-notifications-action'),
        row: selenium_webdriver_1.By.className('monaco-list-row')
    }
};
const input = {
    Input: {
        inputBox: selenium_webdriver_1.By.className('monaco-inputbox'),
        input: selenium_webdriver_1.By.className('input'),
        quickPickIndex: (index) => selenium_webdriver_1.By.xpath(`.//div[@role='treeitem' and @data-index='${index}']`),
        quickPickPosition: (index) => selenium_webdriver_1.By.xpath(`.//div[@role='treeitem' and @aria-posinset='${index}']`),
        quickPickLabel: selenium_webdriver_1.By.className('label-name'),
        quickPickDescription: selenium_webdriver_1.By.className('label-description')
    },
    InputBox: {
        constructor: selenium_webdriver_1.By.className('quick-input-widget'),
        message: selenium_webdriver_1.By.className('quick-input-message'),
        progress: selenium_webdriver_1.By.className('quick-input-progress'),
        quickList: selenium_webdriver_1.By.className('quick-input-list'),
        rows: selenium_webdriver_1.By.className('monaco-list-rows'),
        row: selenium_webdriver_1.By.className('monaco-list-row')
    },
    QuickOpenBox: {
        constructor: selenium_webdriver_1.By.className('monaco-quick-open-widget'),
        progress: selenium_webdriver_1.By.className('monaco-progress-container'),
        quickList: selenium_webdriver_1.By.className('quick-open-tree'),
        row: selenium_webdriver_1.By.xpath(`.//div[@role='treeitem']`)
    }
};
/**
 * All available locators for vscode version 1.37.0
 */
exports.locators = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, activityBar), bottomBar), editor), menu), sideBar), statusBar), workbench), input);
//# sourceMappingURL=1.37.0.js.map