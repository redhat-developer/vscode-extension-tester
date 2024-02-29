import { By, LocatorDiff } from "monaco-page-objects";
export const diff: LocatorDiff = {
    locators: {
        BottomBarPanel: {
            close: 'Hide Panel',
            globalActions: By.className('global-actions'),
            action: (label: string) => By.xpath(`.//a[starts-with(@aria-label, '${label}')]`)
        },
        SettingsEditor: {
            comboValue: 'value'
        }
    }
}