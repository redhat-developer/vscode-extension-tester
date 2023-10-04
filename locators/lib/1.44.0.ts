import { LocatorDiff } from "monaco-page-objects";
import { By } from "selenium-webdriver";

export const diff: LocatorDiff = {
    locators: {
        Input: {
            quickPickIndex: (index: number) => By.xpath(`.//div[@role='option' and @data-index='${index}']`),
            multiSelectIndex: (index: number) => By.xpath(`.//div[@role='option' and @data-index='${index}']`)
        }
    }
}