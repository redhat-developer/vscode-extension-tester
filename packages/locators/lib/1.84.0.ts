import { By, LocatorDiff } from "@redhat-developer/page-objects";
export const diff: LocatorDiff = {
    locators: {
        BottomBarPanel: {
            tabContainer: By.className('composite-bar-container')
        }
    }
}