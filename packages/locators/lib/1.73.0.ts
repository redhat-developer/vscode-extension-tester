import { By, LocatorDiff } from "@redhat-developer/page-objects";
export const diff: LocatorDiff = {
    locators: {
        ProblemsView: {
            markersFilter: By.className('viewpane-filter')
        }
    }
};