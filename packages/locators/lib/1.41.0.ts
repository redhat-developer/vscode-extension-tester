import { LocatorDiff } from "@vscode-extension-tester/page-objects";
import { By } from "selenium-webdriver";

export const diff: LocatorDiff = {
    locators: {
        ViewSection: {
            header: By.className('pane-header')
        },
        ScmView: {
            providerHeader: By.css(`div[class*='pane-header scm-provider']`)
        }
    }
}