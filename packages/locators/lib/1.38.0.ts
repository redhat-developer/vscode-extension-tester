import { LocatorDiff } from "@vscode-extension-tester/page-objects";
import { By } from "selenium-webdriver";

export const diff: LocatorDiff = {
    locators: {
        EditorView: {
            settingsEditor: By.xpath(`.//div[@data-editor-id='workbench.editor.settings2']`),
            webView: By.xpath(`.//div[@data-editor-id='WebviewEditor']`)
        }
    }
}