import { By, LocatorDiff } from "monaco-page-objects";

export const diff: LocatorDiff = {
    locators: {
        BottomBarPanel: {
            action: (label: string) => By.xpath(`.//li[starts-with(@title, '${label}')]`)
        }
    }
}