import { LocatorDiff } from "@vscode-extension-tester/page-objects";
import { By } from "selenium-webdriver";

export const diff: LocatorDiff = {
    locators: {
        EditorView: {
            webView: By.xpath(`.//div[starts-with(@id, 'webview-editor')]`)
        },
        TerminalView: {
            newTerminal: By.xpath(`.//a[@title='New Terminal']`) 
        }
    }
}