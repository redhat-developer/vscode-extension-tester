"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const selenium_webdriver_1 = require("selenium-webdriver");
exports.diff = {
    locators: {
        BottomBarViews: {
            clearText: selenium_webdriver_1.By.className('codicon-clear-all')
        },
        NotificationsCenter: {
            close: selenium_webdriver_1.By.className('codicon-chevron-down'),
            clear: selenium_webdriver_1.By.className('codicon-close-all')
        },
        Notification: {
            dismiss: selenium_webdriver_1.By.className('codicon-close')
        }
    }
};
//# sourceMappingURL=1.39.0.js.map