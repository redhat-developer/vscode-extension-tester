import { By, fromText, LocatorDiff } from "@vscode-extension-tester/page-objects";
export const diff: LocatorDiff = {
    locators: {
        BottomBarPanel: {
            close: 'Hide Panel',
            globalActions: By.className('global-actions'),
            action: (label: string) => By.xpath(`.//a[starts-with(@aria-label, '${label}')]`)
        },
        SettingsEditor: {
            comboValue: 'value'
        },
        FindWidget: {
            checkbox: (title: string) => By.xpath(`.//div[@role='checkbox' and starts-with(@aria-label, "${title}")]`)
        },
        Notification: {
            buttonConstructor: (title: string) => By.xpath(`.//a[@role='button' and text()='${title}']`),
            actionLabel: {
                value: fromText()
            }
        },
        ScmView: {
            action: By.className('action-label'),
            actionConstructor: (title: string) => By.xpath(`.//a[@aria-label='${title}']`),
            actionLabel: 'aria-label'
        },
        ViewTitlePart: {
            actionLabel: 'aria-label'
        },
        DefaultTreeItem: {
            labelAttribute: 'aria-label'
        },
        Dialog: {
            buttonLabel: {
                value: fromText()
            }
        }
    }
}