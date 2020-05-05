"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const selenium_webdriver_1 = require("selenium-webdriver");
exports.diff = {
    locators: {
        Input: {
            quickPickIndex: (index) => selenium_webdriver_1.By.xpath(`.//div[@role='listitem' and @data-index='${index}']`)
        },
        NotificationsCenter: {
            close: selenium_webdriver_1.By.className('codicon-chevron-down')
        }
    }
};
//# sourceMappingURL=1.43.0.js.map