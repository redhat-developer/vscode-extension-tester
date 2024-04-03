import { By, LocatorDiff } from "@redhat-developer/page-objects";

export const diff: LocatorDiff = {
    locators: {
        ContextMenu: {
            constructor: By.className('monaco-menu')
        },
        BottomBarPanel: {
            close: 'Close Panel',
            closeAction: By.className('codicon-panel-close')
        }
    }
}