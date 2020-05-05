"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const selenium_webdriver_1 = require("selenium-webdriver");
exports.diff = {
    locators: {
        EditorView: {
            settingsEditor: selenium_webdriver_1.By.xpath(`.//div[@data-editor-id='workbench.editor.settings2']`),
            webView: selenium_webdriver_1.By.xpath(`.//div[@data-editor-id='WebviewEditor']`)
        }
    }
};
//# sourceMappingURL=1.38.0.js.map