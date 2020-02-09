import { Editor } from './Editor';
import { TextEditor } from './TextEditor';
import { EditorView } from './EditorView';

/**
 * Page object representing a diff editor
 */
export class DiffEditor extends Editor {

    /**
     * Gets the text editor corresponding to the originalside.
     * (The left side of the diff editor)
     */

    async getOriginalEditor(): Promise<TextEditor> {
        const element = await this.getEnclosingElement().findElement(DiffEditor.locators.DiffEditor.originalEditor);
        return new TextEditor(new EditorView(), this.getTitle(), element);
    }

    /**
     * Gets the text editor corresponding to the modified side.
     * (The right side of the diff editor)
     */
    async getModifiedEditor(): Promise<TextEditor> {
        const element = await this.getEnclosingElement().findElement(DiffEditor.locators.DiffEditor.modifiedEditor);
        return new TextEditor(new EditorView(), this.getTitle(), element);
    }
}