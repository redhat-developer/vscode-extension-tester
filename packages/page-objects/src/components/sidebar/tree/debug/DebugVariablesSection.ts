import { WebElement } from "selenium-webdriver";
import { ViewContent } from "../../ViewContent";
import { GenericCustomTreeSection } from "../custom/CustomTreeSection";
import { VariableSectionItem } from "./VariableSectionItem";

export class DebugVariableSection extends GenericCustomTreeSection<VariableSectionItem> {
    constructor(panel: WebElement, viewContent: ViewContent) {
        super(panel, viewContent, VariableSectionItem);
    }
}
