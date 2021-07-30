import { By, LocatorDiff } from "monaco-page-objects";

export const diff: LocatorDiff = {
    locators: {
        FindWidget: {
            toggleReplace: By.xpath(`.//div[@title="Toggle Replace"]`),
        }
    }
}