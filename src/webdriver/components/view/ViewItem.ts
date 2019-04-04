import { ElementWithContexMenu } from "../ElementWithContextMenu";
import { ViewSection } from "../../../extester";
import { By } from "selenium-webdriver";

export class ViewItem extends ElementWithContexMenu {
    private label: string;

    constructor(label: string, viewPart: ViewSection) {
        super(By.xpath(`.//div[@class='monaco-list-row' and @aria-label='${label}']`), viewPart);
        this.label = label;
    }

    getLabel(): string {
        return this.label;
    }
}