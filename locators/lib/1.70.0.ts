import { By, LocatorDiff } from "monaco-page-objects";

export const diff: LocatorDiff = {
    locators: {
        BottomBarPanel: {
            action: (label: string) => By.xpath(`.//li[starts-with(@title, '${label}')]`)
        },
        ViewSection: {
            buttonLabel: 'aria-label'
        },
        ViewTitlePart: {
            action: By.className(`action-label`),
            actionContstructor: (title: string) => By.xpath(`.//a[@title='${title}']`)
        },
        ScmView: {
            action: By.className('action-item menu-entry'),
            actionConstructor: (title: string) => By.xpath(`.//li[@title='${title}']`)
        }
    }
}