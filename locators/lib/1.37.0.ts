import { By } from "selenium-webdriver";
import { Locators } from "monaco-page-objects";

const activityBar = {
    ActionsControl: {
        constructor: (title: string) => By.xpath(`.//li[@aria-label='${title}']`)
    },
    ActivityBar: {
        constructor: By.id('workbench.parts.activitybar'),
        viewContainer: By.xpath(`.//ul[@aria-label='Active View Switcher']`),
        label: 'aria-label',
        actionsContainer: By.className('actions-container'),
        actionItem: By.className('action-item')
    },
    ViewControl: {
        constructor: (title: string) => By.xpath(`.//li[contains(@aria-label, '${title}')]`),
        attribute: 'class',
        klass: 'checked'
    }
}

const bottomBar = {
    BottomBarPanel: {
        constructor: By.id('workbench.parts.panel'),
        problemsTab: 'Problems',
        outputTab: 'Output',
        debugTab: 'Debug Console',
        terminalTab: 'Terminal',
        maximize: 'Maximize Panel Size',
        restore: 'Restore Panel Size',
        tabContainer: By.className('panel-switcher-container'),
        tab: (title: string) => By.xpath(`.//li[starts-with(@title, '${title}')]`),
        actions: By.className('title-actions'),
        action: (label: string) => By.xpath(`.//a[starts-with(@title, '${label}')]`)
    },
    BottomBarViews: {
        actionsContainer: (label: string) => By.xpath(`.//ul[@aria-label='${label}']`),
        channelOption: By.tagName('option'),
        channelCombo: By.tagName('select'),
        channelText: By.className('option-text'),
        channelRow: By.className('monaco-list-row'),
        textArea: By.tagName('textarea'),
        clearText: By.className('clear-output')
    },
    ProblemsView: {
        constructor: By.id('workbench.panel.markers'),
        markersFilter: By.className('markers-panel-action-filter'),
        input: By.tagName('input'),
        collapseAll: By.className('collapse-all'),
        markerRow: By.className('monaco-list-row'),
        rowLabel: 'aria-label',
        markerTwistie: By.className('monaco-tl-twistie')
    },
    TerminalView: {
        constructor: By.id('workbench.panel.terminal'),
        actionsLabel: 'Terminal actions',
        textArea: By.className('xterm-helper-textarea'),
        killTerminal: By.xpath(`.//a[@title='Kill Terminal']`),
        newTerminal: By.xpath(`.//a[starts-with(@title,'New Terminal')]`)
    },
    DebugConsoleView: {
        constructor: By.id('workbench.panel.repl')
    },
    OutputView: {
        constructor: By.id('workbench.panel.output'),
        actionsLabel: 'Output actions'
    }
}

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
        tabLabel: 'aria-label'
    },
    Editor: {
        constructor: By.className('editor-instance'),
        inputArea: By.className('inputarea')
    },
    TextEditor: {
        activeTab: By.css('div.tab.active'),
        editorContainer: By.className('monaco-editor'),
        dataUri: 'data-uri',
        formatDoc: 'Format Document'
    },
    ContentAssist: {
        constructor: By.className('suggest-widget'),
        message: By.className('message'),
        itemRows: By.className('monaco-list-rows'),
        itemRow: By.className('monaco-list-row'),
        itemLabel: By.className('label-name'),
        itemText: By.xpath(`./span/span`)
    },
    SettingsEditor: {
        title: 'Settings',
        itemRow: By.className('monaco-list-row'),
        header: By.className('settings-header'),
        tabs: By.className('settings-tabs-widget'),
        actions: By.className('actions-container'),
        action: (label: string) => By.xpath(`.//a[@title='${label}']`),
        settingConstructor: (title: string, category: string) => By.xpath(`.//div[@class='monaco-tl-row' and .//span/text()='${title}' and .//span/text()='${category}: ']`),
        settingDesctiption: By.className('setting-item-description'),
        comboSetting: By.tagName('select'),
        comboOption: By.className('option-text'),
        textSetting: By.tagName('input'),
        checkboxSetting: By.className('setting-value-checkbox'),
        checkboxChecked: 'aria-checked',
        linkButton: By.className('edit-in-settings-button')
    },
    DiffEditor: {
        originalEditor: By.className('original-in-monaco-diff-editor'),
        modifiedEditor: By.className('modified-in-monaco-diff-editor')
    }
}

const menu = {
    ContextMenu: {
        contextView: By.className('context-view'),
        constructor: By.className('monaco-menu-container'),
        itemConstructor: (label: string) => By.xpath(`.//li[a/span/@aria-label='${label}']`),
        itemElement: By.className('action-item'),
        itemLabel: By.className('action-label'),
        itemText: 'aria-label',
        itemNesting: By.className('submenu-indicator')
    },
    TitleBar: {
        constructor: By.id('workbench.parts.titlebar'),
        itemConstructor: (label: string) => By.xpath(`.//div[@aria-label='${label}']`),
        itemElement: By.className('menubar-menu-button'),
        itemLabel: 'aria-label',
        title: By.className('window-title')
    },
    WindowControls: {
        constructor: By.className('window-controls-container'),
        minimize: By.className('window-minimize'),
        maximize: By.className('window-maximize'),
        restore: By.className('window-unmaximize'),
        close: By.className('window-close')
    }
}

const sideBar = {
    SideBarView: {
        constructor: By.id('workbench.parts.sidebar')
    },
    ViewTitlePart: {
        constructor: By.className('composite title'),
        title: By.tagName('h2'),
        action: By.className(`action-label`),
        actionLabel: 'title',
        actionContstructor: (title: string) => By.xpath(`.//a[@title='${title}']`)
    },
    ViewContent: {
        constructor: By.className('content'),
        progress: By.className('monaco-progress-container'),
        section: By.className('split-view-view'),
        sectionTitle: By.className('title'),
        sectionText: 'textContent',
        defaultView: By.className('explorer-folders-view'),
        extensionsView: By.className('extensions-list')
    },
    ViewSection: {
        title: By.className('title'),
        titleText: 'textContent',
        header: By.className('panel-header'),
        headerExpanded: 'aria-expanded',
        actions: By.className('actions'),
        actionConstructor: (label: string) => By.xpath(`.//a[contains(@class, 'action-label') and @role='button' and @title='${label}']`),
        button: By.xpath(`.//a[@role='button']`),
        buttonLabel: 'title',
        level: 'aria-level'
    },
    TreeItem: {
        actions: By.className('actions-container'),
        actionLabel: By.className('action-label'),
        actionTitle: 'title'
    },
    DefaultTreeSection: {
        itemRow: By.className('monaco-list-row'),
        itemLabel: 'aria-label',
        rowContainer: By.className('monaco-list'),
        rowWithLabel: (label: string) => By.xpath(`.//div[contains(@class, 'monaco-list-row') and @aria-label='${label}']`),
        lastRow: By.xpath(`.//div[@data-last-element='true']`)
    },
    DefaultTreeItem: {
        constructor: (label: string) => By.xpath(`.//div[@role='treeitem' and @aria-label='${label}']`),
        twistie: By.className('monaco-tl-twistie')
    },
    CustomTreeSection: {
        itemRow: By.className('monaco-list-row'),
        itemLabel: By.className('monaco-highlighted-label'),
        rowContainer: By.className('monaco-list'),
        rowWithLabel: (label: string) => By.xpath(`.//span[contains(text(), '${label}')]`)
    },
    CustomTreeItem: {
        constructor: (label: string) => By.xpath(`.//div[@role='treeitem' and .//span[text()='${label}']]`),
        expandedAttr: 'aria-expanded',
        expandedValue: 'true'
    },
    ExtensionsViewSection: {
        items: By.className('monaco-list-rows'),
        itemRow: By.className('monaco-list-row'),
        itemTitle: By.className('name'),
        searchBox: By.className('inputarea'),
        textContainer: By.className('view-line'),
        textField: By.className('mtk1')
    },
    ExtensionsViewItem: {
        version: By.className('version'),
        author: By.className('author'),
        description: By.className('description'),
        install: By.className('install'),
        manage: By.className('manage')
    },
    ScmView: {
        providerHeader: By.css(`div[class*='panel-header scm-provider']`),
        providerRelative: By.xpath(`./..`),
        initButton: By.xpath(`.//a[text()='Initialize Repository']`),
        providerTitle: By.className('title'),
        providerType: By.className('type'),
        action: By.className('action-label'),
        inputField: By.tagName('textarea'),
        changeItem: By.xpath(`.//div[@role='treeitem']`),
        changeName: By.className('name'),
        changeCount: By.className('monaco-count-badge'),
        changeLabel: By.className('label-name'),
        changeDesc: By.className('label-description'),
        resource: By.className('resource'),
        resourceGroup: (label: string) => By.xpath(`.//div[@role="treeitem" and .//div/text()="${label}"]`),
        expand: By.className('monaco-tl-twistie'),
        more: By.className('toolbar-toggle-more')
    }
}

const statusBar = {
    StatusBar: {
        constructor: By.id('workbench.parts.statusbar'),
        language: By.id('status.editor.mode'),
        lines: By.id('status.editor.eol'),
        encoding: By.id('status.editor.encoding'),
        indent: By.id('status.editor.indentation'),
        selection: By.id('status.editor.selection'),
        notifications: By.className('notifications-center'),
        bell: By.id('status.notifications')
    }
}

const workbench = {
    Workbench: {
        constructor: By.className('monaco-workbench'),
        notificationContainer: By.className('notification-toast-container'),
        notificationItem: By.className('monaco-list-row')
    },
    Notification: {
        message: By.className('notification-list-item-message'),
        icon: By.className('notification-list-item-icon'),
        source: By.className('notification-list-item-source'),
        progress: By.className('monaco-progress-container'),
        dismiss: By.className('clear-notification-action'),
        actions: By.className('notification-list-item-buttons-container'),
        action: By.className('monaco-button'),
        actionLabel: 'title',
        standalone: (id: string) => By.xpath(`.//div[contains(@class, 'monaco-list-row') and @id='${id}']`),
        standaloneContainer: By.className('notifications-toasts'),
        center: (index: number) => By.xpath(`.//div[contains(@class, 'monaco-list-row') and @data-index='${index}']`),
        buttonConstructor: (title: string) => By.xpath(`.//a[@role='button' and @title='${title}']`)
    },
    NotificationsCenter: {
        constructor: By.className('notifications-center'),
        close: By.className('hide-all-notifications-action'),
        clear: By.className('clear-all-notifications-action'),
        row: By.className('monaco-list-row')
    }
}

const input = {
    Input: {
        inputBox: By.className('monaco-inputbox'),
        input: By.className('input'),
        quickPickIndex: (index: number) => By.xpath(`.//div[@role='treeitem' and @data-index='${index}']`),
        quickPickPosition: (index: number) => By.xpath(`.//div[@role='treeitem' and @aria-posinset='${index}']`),
        quickPickLabel: By.className('label-name'),
        quickPickDescription: By.className('label-description'),
        titleBar: By.className('quick-input-titlebar'),
        title: By.className('quick-input-title'),
        backButton: By.className('codicon-quick-input-back')
    },
    InputBox: {
        constructor: By.className('quick-input-widget'),
        message: By.className('quick-input-message'),
        progress: By.className('quick-input-progress'),
        quickList: By.className('quick-input-list'),
        rows: By.className('monaco-list-rows'),
        row: By.className('monaco-list-row')
    },
    QuickOpenBox: {
        constructor: By.className('monaco-quick-open-widget'),
        progress: By.className('monaco-progress-container'),
        quickList: By.className('quick-open-tree'),
        row: By.xpath(`.//div[@role='treeitem']`)
    }
}

/**
 * All available locators for vscode version 1.37.0
 */
export const locators: Locators = {
    ...activityBar,
    ...bottomBar,
    ...editor,
    ...menu,
    ...sideBar,
    ...statusBar,
    ...workbench,
    ...input
}
