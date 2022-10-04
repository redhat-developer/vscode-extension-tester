import { By, LocatorDiff } from "monaco-page-objects";

export const diff: LocatorDiff = {
    locators: {
        ViewTitlePart: {
            actionLabel: 'aria-label',
            actionContstructor: (title: string) => By.xpath(`.//a[@aria-label='${title}']`)
        }
    }
}