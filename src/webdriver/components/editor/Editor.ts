import { ElementWithContexMenu } from "../ElementWithContextMenu";
import { EditorView } from "../../../extester";
import { By } from 'selenium-webdriver';

/**
 * Abstract representation of an editor tab
 */
export abstract class Editor extends ElementWithContexMenu {
    private title: string;

    constructor(view: EditorView = new EditorView(), title: string) {
        super(By.className('editor-instance'), view);
        this.title = title;
    }

    /**
     * Get title/name of the open editor
     */
    getTitle(): string {
        return this.title;
    }
}