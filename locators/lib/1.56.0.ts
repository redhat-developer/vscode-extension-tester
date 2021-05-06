import { LocatorDiff } from "monaco-page-objects";
import { By } from "selenium-webdriver";

export const diff: LocatorDiff = {
    locators: {
        TerminalView: {
            newTerminal: By.xpath(`.//a[@title='New Terminal']`) 
        }
    }
}