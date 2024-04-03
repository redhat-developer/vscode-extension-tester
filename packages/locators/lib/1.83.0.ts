import { By, LocatorDiff } from "@redhat-developer/page-objects";
export const diff: LocatorDiff = {
    locators: {
        ViewSection: {
            actionConstructor: (label: string) => By.xpath(`.//a[contains(@class, 'action-label') and @role='button' and @aria-label='${label}']`),
        }
    }
}