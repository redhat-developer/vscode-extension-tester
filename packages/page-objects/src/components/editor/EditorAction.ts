import { EditorGroup } from "./EditorView";
import { AbstractElement } from "../AbstractElement";
import { WebElement } from "../..";

export class EditorAction extends AbstractElement {
    constructor(element: WebElement, parent: EditorGroup) {
        super(element, parent);
    }

    /**
     * Get text description of the action.
     */
    async getTitle(): Promise<string> {
        return await this.getAttribute(EditorAction.locators.EditorView.attribute);
    }
}
