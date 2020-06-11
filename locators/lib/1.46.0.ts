import { LocatorDiff } from "monaco-page-objects";
import { By } from "selenium-webdriver";

export const diff: LocatorDiff = {
    locators: {
        CustomTreeItem: {
            constructor: (label: string) => By.xpath(`.//div[@role='listitem' and .//span[text()='${label}']]`)
        }
    }
}