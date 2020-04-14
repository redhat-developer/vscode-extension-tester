import { LocatorDiff } from "../locators";
import { By } from "selenium-webdriver";

export const diff: LocatorDiff = {
    locators: {
        Input: {
            quickPickIndex: (index: number) => By.xpath(`.//div[@role='option' and @data-index='${index}']`)
        }
    }
}