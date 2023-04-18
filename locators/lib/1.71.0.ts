import { LocatorDiff } from "monaco-page-objects";
import { By } from "selenium-webdriver";

export const diff: LocatorDiff = {
    locators: {
        EditorView: {
            attribute: 'aria-label'
        },
        TreeItem: {
            actionTitle: 'aria-label'
        },
        Input: {
            multiSelectIndex: (index: number) => By.xpath(`.//div[@role='checkbox' and @data-index='${index}']`)
        }
    }
}
