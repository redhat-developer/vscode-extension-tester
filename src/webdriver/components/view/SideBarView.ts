import { AbstractElement } from "../AbstractElement";
import { By } from "selenium-webdriver";
import { ElementWithContexMenu } from "../ElementWithContextMenu";

export class SideBarView extends AbstractElement {
    constructor() {
        super(By.id('workbench.parts.sidebar'), By.id('workbench.main.container'));
    }
}

export class VievTitlePart extends ElementWithContexMenu {
    constructor(view: SideBarView) {
        super(By.className('composite-title'), view);
    }
}