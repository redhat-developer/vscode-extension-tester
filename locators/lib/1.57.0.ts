import { LocatorDiff } from "monaco-page-objects";
import { By } from "selenium-webdriver";

export const diff: LocatorDiff = {
    locators: {
        EditorView: {
            settingsEditor: By.className('settings-editor'),
            webView: By.xpath(`.//div[starts-with(@id, 'webview-editor')]`)
        },
        TerminalView: {
            constructor: By.className('integrated-terminal')
        }
    }
}