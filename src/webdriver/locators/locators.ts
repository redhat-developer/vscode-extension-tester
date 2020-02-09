import { By } from "selenium-webdriver";
import { DeepPartial } from 'ts-essentials'; 

/**
 * Type definitions for all used locators
 */
export interface Locators {
    // Activity Bar
    ActionsControl: {
        constructor: (title: string) => By
    }
    ActivityBar: {
        constructor: By
        viewContainer: By
        label: string
        actionsContainer: By
        actionItem: By
    }
    ViewControl: {
        constructor: (title: string) => By
        attribute: string
        klass: string
    }

    // Bottom Bar
    BottomBarPanel: {
        constructor: By
        problemsTab: string
        outputTab: string
        debugTab: string
        terminalTab: string
        maximize: string
        restore: string
        tabContainer: By
        tab: (title: string) => By
        actions: By
        action: (label: string) => By
    }
    BottomBarViews: {
        actionsContainer: (label: string) => By
        channelOption: By
        channelCombo: By
        channelText: By
        channelRow: By
        textArea: By
        clearText: By
    }
    ProblemsView: {
        constructor: By
        markersFilter: By
        input: By
        collapseAll: By
        markerRow: By
        rowLabel: string
        markerTwistie: By
    }
    TerminalView: {
        constructor: By
        actionsLabel: string
        textArea: By
        killTerminal: By
        newTerminal: By
    }
    DebugConsoleView: {
        constructor: By
    }
    OutputView: {
        constructor: By
        actionsLabel: string
    }

    // Editors
    EditorView: {
        constructor: By
        parent: By
        settingsEditor: By
        webView: By
        diffEditor: By
        tab: By
        closeTab: By
        tabTitle: string
        tabLabel: string
    }
    Editor: {
        constructor: By
        inputArea: By
    }
    TextEditor: {
        activeTab: By
        editorContainer: By
        dataUri: string
        formatDoc: string
    }
    ContentAssist: {
        constructor: By
        message: By
        itemRows: By
        itemRow: By
        itemLabel: By
        itemText: By
    }
    SettingsEditor: {
        title: string
        itemRow: By
        header: By
        tabs: By
        actions: By
        action: (label: string) => By
        settingConstructor: (title: string, category: string) => By
        settingDesctiption: By
        comboSetting: By
        comboOption: By
        textSetting: By
        checkboxSetting: By
        checkboxChecked: string
        linkButton: By
    }
    DiffEditor: {
        originalEditor: By
        modifiedEditor: By
    }

    // Menus
    ContextMenu: {
        contextView: By
        constructor: By
        itemConstructor: (label: string) => By
        itemElement: By
        itemLabel: By
        itemText: string
        itemNesting: By
    }
    TitleBar: {
        constructor: By
        itemConstructor: (label: string) => By
        itemElement: By
        itemLabel: string
        title: By
    }
    WindowControls: {
        constructor: By
        minimize: By
        maximize: By
        restore: By
        close: By
    }

    // Side Bar
    SideBarView: {
        constructor: By
    }
    ViewTitlePart: {
        constructor: By
        title: By
        action: By
        actionLabel: string
        actionContstructor: (title: string) => By
    }
    ViewContent: {
        constructor: By
        progress: By
        section: By
        sectionTitle: By
        sectionText: string
        defaultView: By
        extensionsView: By
    }
    ViewSection: {
        title: By
        titleText: string
        header: By
        headerExpanded: string
        actions: By
        actionConstructor: (label: string) => By
        button: By
        buttonLabel: string
        level: string
    }
    TreeItem: {
        actions: By
        actionLabel: By
        actionTitle: string
    }
    DefaultTreeSection: {
        itemRow: By
        itemLabel: string
        rowContainer: By
        rowWithLabel: (label: string) => By
        lastRow: By
    }
    DefaultTreeItem: {
        constructor: (label: string) => By
        twistie: By
    }
    CustomTreeSection: {
        itemRow: By
        itemLabel: By
        rowContainer: By
        rowWithLabel: (label: string) => By
    }
    CustomTreeItem: {
        constructor: (label: string) => By
        expandedAttr: string
        expandedValue: string
    }
    ExtensionsViewSection: {
        items: By
        itemRow: By
        itemTitle: By
        searchBox: By
        textContainer: By
        textField: By
    }
    ExtensionsViewItem: {
        version: By
        author: By
        description: By
        install: By
        manage: By
    }
    
    // Status Bar
    StatusBar: {
        constructor: By
        language: By
        lines: By
        encoding: By
        indent: By
        selection: By
        notifications: By
        bell: By
    }

    // Workbench
    Workbench: {
        constructor: By
        notificationContainer: By
        notificationItem: By
    }
    Notification: {
        message: By
        icon: By
        source: By
        progress: By
        dismiss: By
        actions: By
        action: By
        actionLabel: string
        standalone: (id: string) => By
        standaloneContainer: By
        center: (index: number) => By
        buttonConstructor: (title: string) => By
    }
    NotificationsCenter: {
        constructor: By
        close: By
        clear: By
        row: By
    }

    // Inputs
    Input: {
        inputBox: By
        input: By
        quickPickIndex: (index: number) => By
        quickPickPosition: (index: number) => By
        quickPickLabel: By,
        quickPickDescription: By
    }
    InputBox: {
        constructor: By
        message: By
        progress: By
        quickList: By
        rows: By
        row: By
    }
    QuickOpenBox: {
        constructor: By
        progress: By
        quickList: By
        row: By
    }
}

/**
 * Definition for locator diff object
 */
export interface LocatorDiff {
    locators: DeepPartial<Locators>
    extras?: Object
}