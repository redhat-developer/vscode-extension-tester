import { expect } from 'chai';
import { TextEditor, EditorView, Workbench, DiffEditor, QuickOpenBox } from "vscode-extension-tester";

describe('DiffEditor', async () => {
    let editor: DiffEditor;

    before(async function() {
        this.timeout(15000);
        await new Workbench().executeCommand('File: New Untitled File');
        await new Promise((res) => { setTimeout(res, 500); });
        const editorA = new TextEditor(new EditorView(), 'Untitled-1');
        await editorA.setText('a')

        await new Workbench().executeCommand('File: New Untitled File');
        await new Promise((res) => { setTimeout(res, 500); });
        const editorB = new TextEditor(new EditorView(), 'Untitled-2');
        await editorB.setText('b');
        
        await new Workbench().executeCommand('File: Compare Active File With...');
        const quickOpen = new QuickOpenBox();
        await quickOpen.setText('Untitled-1');
        await quickOpen.confirm();

        editor = new DiffEditor(new EditorView(), 'b ↔ a');
    });

    after(async () => {
        await new EditorView().closeAllEditors();
    });

    it('can get original and modified editors', async function() {
        const originalEditor = await editor.getOriginalEditor();
        const modifiedEditor = await editor.getModifiedEditor();

        expect(await originalEditor.getText()).equals('b');
        expect(await modifiedEditor.getText()).equals('a');
    });
});
