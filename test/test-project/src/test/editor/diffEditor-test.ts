import * as path from 'path';
import { expect } from 'chai';
import { EditorView, Workbench, DiffEditor, QuickOpenBox, InputBox } from "vscode-extension-tester";

describe('DiffEditor', async () => {
    let editor: DiffEditor;

    before(async function() {
        this.timeout(250000);
        await new Workbench().executeCommand('extest open file');
        let input = await InputBox.create();
        await input.setText(path.resolve(__dirname, '..', '..', '..', '..', 'resources', 'test-file-a.txt'));
        await input.confirm();
        await new Promise((res) => { setTimeout(res, 500); });
        
        await new Workbench().executeCommand('extest open file');
        input = await InputBox.create();
        await input.setText(path.resolve(__dirname, '..', '..', '..', '..', 'resources', 'test-file-b.txt'));
        await input.confirm();
        await new Promise((res) => { setTimeout(res, 500); });
        
        await new Workbench().executeCommand('File: Compare Active File With...');
        const quickOpen = new QuickOpenBox();
        await quickOpen.setText('test-file-a.txt');
        await quickOpen.confirm();
        
        editor = new DiffEditor(new EditorView(), 'test-file-b.txt');
    });

    after(async () => {
        await new Workbench().executeCommand('View: Close Editor');
        await new Promise((res) => { setTimeout(res, 500); });
        const editorView = new EditorView();
        await editorView.closeEditor('test-file-b.txt');
        await editorView.closeEditor('test-file-a.txt');
    });

    it('can get original and modified editors', async function() {
        const originalEditor = await editor.getOriginalEditor();
        const modifiedEditor = await editor.getModifiedEditor();

        expect(await originalEditor.getText()).equals('b');
        expect(await modifiedEditor.getText()).equals('a');
    });
});
