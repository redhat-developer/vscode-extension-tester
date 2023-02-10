import { By, LocatorDiff } from "monaco-page-objects";
export const diff: LocatorDiff = {
    locators: {
        TerminalView: {
            selectedRow: By.className('monaco-list-row selected')
        }
    }
}
