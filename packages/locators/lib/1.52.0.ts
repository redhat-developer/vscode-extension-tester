import { LocatorDiff } from "@vscode-extension-tester/page-objects";
import { By } from "selenium-webdriver";

export const diff: LocatorDiff = {
    locators: {
        DefaultTreeItem: {
            tooltip: By.className('monaco-icon-label-container')
        }
    }
}