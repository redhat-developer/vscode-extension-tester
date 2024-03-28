import { LocatorDiff } from "@vscode-extension-tester/page-objects";
import { By } from "selenium-webdriver";

export const diff: LocatorDiff = {
    locators: {
        EditorView: {
            tabSeparator: ''
        },
        NotificationsCenter: {
            clear: By.className('codicon-notifications-clear-all'),
            close: By.className('codicon-notifications-hide')
        },
        Notification: {
            dismiss: By.className('codicon-notifications-clear')
        },
        ScmView: {
            more: By.className('codicon-toolbar-more')
        }
    }
}