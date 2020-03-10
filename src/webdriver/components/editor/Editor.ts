import { ElementWithContexMenu } from "../ElementWithContextMenu";
import { EditorView, EditorGroup } from "../../../extester";
import { WebElement, Locator } from 'selenium-webdriver';

/**
 * Abstract representation of an editor tab
 */
export abstract class Editor extends ElementWithContexMenu {
    private title: string;

    constructor(view: EditorView | EditorGroup = new EditorView(), title: string, base: Locator | WebElement = Editor.locators.Editor.constructor) {
        super(base, view);
        this.title = title;
    }

    /**
     * Get title/name of the open editor
     */
    getTitle(): string {
        return this.title;
    }
}