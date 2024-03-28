import { LocatorDiff } from "@vscode-extension-tester/page-objects";
import { By } from "selenium-webdriver";

export const diff: LocatorDiff = {
    locators: {
        TerminalView: {
            newTerminal: By.xpath(`.//a[starts-with(@title, 'Create New Integrated Terminal')]`),
            killTerminal: By.xpath(`.//a[@title='Kill the Active Terminal Instance']`)  
        }
    }
}