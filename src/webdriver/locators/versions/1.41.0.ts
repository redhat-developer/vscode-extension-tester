import { LocatorDiff } from "../locators";
import { By } from "selenium-webdriver";

export const diff: LocatorDiff = {
    locators: {
        ViewSection: {
            header: By.className('pane-header')
        }
    }
}