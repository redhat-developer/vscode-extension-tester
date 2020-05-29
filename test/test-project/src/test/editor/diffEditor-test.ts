import * as path from 'path';
import { expect } from 'chai';
import { EditorView, Workbench, DiffEditor, QuickOpenBox, InputBox, VSBrowser } from "vscode-extension-tester";

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
        let quickOpen: QuickOpenBox | InputBox;
        if (VSBrowser.instance.version >= '1.44.0') {
            quickOpen = await InputBox.create(); 
        } else {
            quickOpen = await QuickOpenBox.create();
        }
        await quickOpen.setText('test-file-a.txt');
        await quickOpen.confirm();
        
        editor = new DiffEditor();
    });

    after(async () => {
        await new Workbench().executeCommand('View: Close Editor');
        await new Promise((res) => { setTimeout(res, 500); });
        await new EditorView().closeAllEditors();
    });

    it('can get original and modified editors', async function() {
        const originalEditor = await editor.getOriginalEditor();
        const modifiedEditor = await editor.getModifiedEditor();

        expect(await originalEditor.getText()).equals('b');
        expect(await modifiedEditor.getText()).equals('a');
    });
});
