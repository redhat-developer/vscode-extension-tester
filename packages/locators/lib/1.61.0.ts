import { By, LocatorDiff } from "@redhat-developer/page-objects";

export const diff: LocatorDiff = {
    locators: {
        BottomBarPanel: {
            globalActions: By.className('global-actions')
        },
        DefaultTreeItem: {
            tooltip: By.className('monaco-icon-label')
        }
    }
}