import { LocatorDiff } from "@redhat-developer/page-objects";
import { By } from "selenium-webdriver";

export const diff: LocatorDiff = {
    locators: {
        EditorView: {
            settingsEditor: By.className('settings-editor')
        },
        TerminalView: {
            constructor: By.className('integrated-terminal')
        }
    }
}