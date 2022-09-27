import { By } from "selenium-webdriver";
import { DeepPartial } from 'ts-essentials';

/**
 * Type definitions for all used locators
 */
export interface Locators {
    // Activity Bar
    ActivityBar: {
        constructor: By
        viewContainer: By
        label: string
        actionsContainer: By
        actionItem: By
    }
    ViewControl: {
        attribute: string
        klass: string
        scmId: By
        debugId: By
        badge: By
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
        close: string
        tabContainer: By
        tab: (title: string) => By
        actions: By
        globalActions: By
        action: (label: string) => By,
        closeAction: By
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
        changeCount: By
    }
    TerminalView: {
        constructor: By
        actionsLabel: string
        textArea: By
        killTerminal: By
        newTerminal: By
        tabList: By
        singleTab: By
        selectedRow: By
        row: By
        newCommand: string
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
        editorGroup: By
        settingsEditor: By
        webView: By
        diffEditor: By
        tab: By
        closeTab: By
        tabTitle: string
        tabSeparator: string
        tabLabel: string
        actionContainer: By
        actionItem: By
    }
    Editor: {
        constructor: By
        inputArea: By
        title: By
    }
    TextEditor: {
        activeTab: By
        editorContainer: By
        dataUri: string
        formatDoc: string
        marginArea: By
        lineNumber: (line: number) => By
        lineOverlay: (line: number) => By
        breakPoint: By
        debugHint: By
        selection: By
        findWidget: By
    }
    FindWidget: {
        toggleReplace: By
        replacePart: By
        findPart: By
        matchCount: By
        input: By
        content: By
        button: (title: string) => By
        checkbox: (title: string) => By
    }
    ContentAssist: {
        constructor: By
        message: By
        itemRows: By
        itemRow: By
        itemLabel: By
        itemText: By
        itemList: By
        firstItem: By
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
        settingLabel: By
        settingCategory: By
        comboSetting: By
        comboOption: By
        textSetting: By
        checkboxSetting: By
        checkboxChecked: string
        linkButton: By
        itemCount: By
    }
    DiffEditor: {
        originalEditor: By
        modifiedEditor: By
    }
    WebView: {
        iframe: By
        activeFrame: By
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
        viewBlock: By
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
        index: string
        welcomeContent: By
    }
    TreeItem: {
        actions: By
        actionLabel: By
        actionTitle: string,
        twistie: By
    }
    DefaultTreeSection: {
        itemRow: By
        itemLabel: string
        rowContainer: By
        rowWithLabel: (label: string) => By
        lastRow: By
    }
    DefaultTreeItem: {
        ctor: (label: string) => By
        twistie: By
        tooltip: By
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
        tooltipAttribute: string
        description: By
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
    ScmView: {
        providerHeader: By
        providerRelative: By
        initButton: By
        providerTitle: By
        providerType: By
        action: By
        actionConstructor: (title: string) => By
        inputField: By
        changeItem: By
        changeName: By
        changeCount: By
        changeLabel: By
        changeDesc: By
        resource: By
        changes: By
        stagedChanges: By
        expand: By
        more: By
        multiMore: By
        multiScmProvider: By
        singleScmProvider: By
        multiProviderItem: By
        itemLevel: (level: number) => By
        itemIndex: (index: number) => By
    }
    DebugView: {
        launchCombo: By
        launchSelect: By
        launchOption: By
        optionByName: (name: string) => By
        startButton: By
    }
    DebugToolbar: {
        ctor: By
        button: (title: string) => By
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
        item: By
        itemTitle: string
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
        expand: By
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
        quickPickDescription: By,
        quickPickSelectAll: By,
        titleBar: By,
        title: By,
        backButton: By
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

    // Dialogs
    Dialog: {
        constructor: By
        message: By
        details: By
        buttonContainer: By
        button: By
        closeButton: By
    }

    WelcomeContent: {
        button: By,
        text: By,
        buttonOrText: By
    }
}

/**
 * Definition for locator diff object
 */
export interface LocatorDiff {
    locators: DeepPartial<Locators>
    extras?: Object
}