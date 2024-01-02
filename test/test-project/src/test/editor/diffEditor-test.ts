import * as path from 'path';
import { EditorView, Workbench, DiffEditor, QuickOpenBox, InputBox, VSBrowser } from "vscode-extension-tester";

describe('DiffEditor', async () => {
    let editor: DiffEditor;

    before(async function() {
        this.timeout(250000);
        await VSBrowser.instance.openResources(path.resolve(__dirname, '..', '..', '..', '..', 'resources', 'test-file-a.txt'),
            path.resolve(__dirname, '..', '..', '..', '..', 'resources', 'test-file-b.txt'));
        await new EditorView().openEditor('test-file-b.txt');
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

        chai.expect(await originalEditor.getText()).equals('b');
        chai.expect(await modifiedEditor.getText()).equals('a');
    });
});
