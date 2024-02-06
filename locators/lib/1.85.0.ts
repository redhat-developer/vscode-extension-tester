import { By, LocatorDiff } from "monaco-page-objects";
export const diff: LocatorDiff = {
    locators: {
        Workbench: {
            notificationContainer: By.className('notifications-list-container')
        },
        ViewTitlePart: {
            actionConstructor: (title: string) => By.xpath(`.//a[@aria-label='${title}']`)
        },
    }
}