import { By, LocatorDiff } from "monaco-page-objects";

export const diff: LocatorDiff = {
    locators: {
        BottomBarPanel: {
            globalActions: By.className('global-actions')
        }
    }
}