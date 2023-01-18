import { By, LocatorDiff } from "monaco-page-objects";
export const diff: LocatorDiff = {
    locators: {
        ViewTitlePart: {
            action: By.className(`action-item menu-entry`),
            actionContstructor: (title: string) => By.xpath(`.//li[@title='${title}']`)
        }
    }
}