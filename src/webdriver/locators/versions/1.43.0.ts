import { LocatorDiff } from "../locators";
import { By } from "selenium-webdriver";

export const diff: LocatorDiff = {
    locators: {
        Input: {
            quickPickIndex: (index: number) => By.xpath(`.//div[@role='listitem' and @data-index='${index}']`)
        },
        NotificationsCenter: {
            close: By.className('codicon-chevron-down')
        }
    }
}