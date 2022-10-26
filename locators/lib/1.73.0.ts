import { By, LocatorDiff } from "monaco-page-objects";
export const diff: LocatorDiff = {
    locators: {
        ProblemsView: {
            markersFilter: By.className('viewpane-filter')
        }
    }
}