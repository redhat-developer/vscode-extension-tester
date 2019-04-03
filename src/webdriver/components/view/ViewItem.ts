import { ElementWithContexMenu } from "../ElementWithContextMenu";
import { ViewContent } from "../../../extester";
import { By } from "selenium-webdriver";

export class ViewItem extends ElementWithContexMenu {
    constructor(label: string, viewPart: ViewContent) {
        super(By.xpath(`.//div[@class='monaco-list-row' and @aria-label='${label}']`), viewPart);
    }
}