import { LocatorDiff } from "monaco-page-objects";
import { By } from "selenium-webdriver";

export const diff: LocatorDiff = {
    locators: {
        BottomBarViews: {
            clearText: By.className('codicon-clear-all')
        },
        NotificationsCenter: {
            close: By.className('codicon-chevron-down'),
            clear: By.className('codicon-close-all')
        },
        Notification: {
            dismiss: By.className('codicon-close')
        }
    }
}