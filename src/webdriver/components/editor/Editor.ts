import { ElementWithContexMenu } from "../ElementWithContextMenu";
import { EditorView } from "../../../extester";

/**
 * Abstract representation of an editor tab
 */
export abstract class Editor extends ElementWithContexMenu {
    private title: string;

    constructor(view: EditorView = new EditorView(), title: string) {
        super(Editor.locators.Editor.constructor, view);
        this.title = title;
    }

    /**
     * Get title/name of the open editor
     */
    getTitle(): string {
        return this.title;
    }
}