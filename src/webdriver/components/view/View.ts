import { AbstractElement } from "../AbstractElement";
import { By } from "selenium-webdriver";

export class View extends AbstractElement {
    constructor() {
        super(By.id('workbench.parts.sidebar'), By.id('workbench.main.container'));
    }
}