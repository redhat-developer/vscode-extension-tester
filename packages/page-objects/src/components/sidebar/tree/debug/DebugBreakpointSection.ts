import { WebElement } from "selenium-webdriver";
import { ViewContent } from "../../ViewContent";
import { GenericCustomTreeSection } from "../custom/CustomTreeSection";
import { BreakpointSectionItem } from "./BreakpointSectionItem";

export class DebugBreakpointSection extends GenericCustomTreeSection<BreakpointSectionItem>  {
    constructor(panel: WebElement, viewContent: ViewContent) {
        super(panel, viewContent, BreakpointSectionItem);
    }
}
