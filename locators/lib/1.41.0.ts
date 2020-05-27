import { LocatorDiff } from "monaco-page-objects";
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