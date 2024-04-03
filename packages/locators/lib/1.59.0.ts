import { By, LocatorDiff } from "@redhat-developer/page-objects";

export const diff: LocatorDiff = {
    locators: {
        FindWidget: {
            toggleReplace: By.xpath(`.//div[@title="Toggle Replace"]`),
        }
    }
}