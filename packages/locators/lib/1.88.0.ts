import { By, LocatorDiff } from "@redhat-developer/page-objects";

export const diff: LocatorDiff = {
    locators: {
        FindWidget: {
            toggleReplace: By.xpath(`.//div[@aria-label="Toggle Replace"]`),
            button: (title: string) => By.xpath(`.//div[@role='button' and starts-with(@aria-label, "${title}")]`)
        }
    }
};