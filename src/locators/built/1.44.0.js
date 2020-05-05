"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const selenium_webdriver_1 = require("selenium-webdriver");
exports.diff = {
    locators: {
        Input: {
            quickPickIndex: (index) => selenium_webdriver_1.By.xpath(`.//div[@role='option' and @data-index='${index}']`)
        }
    }
};
//# sourceMappingURL=1.44.0.js.map