import { LocatorDiff } from "monaco-page-objects";
import { By } from "selenium-webdriver";

export const diff: LocatorDiff = {
    locators: {
        DefaultTreeItem: {
            tooltip: By.className('monaco-icon-label-container')
        }
    }
}