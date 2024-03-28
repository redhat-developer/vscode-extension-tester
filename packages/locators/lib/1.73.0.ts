import { By, LocatorDiff } from "@vscode-extension-tester/page-objects";
export const diff: LocatorDiff = {
    locators: {
        ProblemsView: {
            markersFilter: By.className('viewpane-filter')
        }
    }
}