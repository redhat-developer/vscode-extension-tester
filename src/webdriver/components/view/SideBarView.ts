import { AbstractElement } from "../AbstractElement";
import { ViewTitlePart, By, ViewContent } from "../../../extester";

export class SideBarView extends AbstractElement {
    constructor() {
        super(By.id('workbench.parts.sidebar'), By.id('workbench.main.container'));
    }

    getTitlePart(): ViewTitlePart {
        return new ViewTitlePart(this);
    }

    getContent(): ViewContent {
        return new ViewContent(this);
    }
}