import { expect } from 'chai';
import { EditorView, Workbench, TextEditor, SettingsEditor, WebView, QuickOpenBox, DiffEditor } from 'vscode-extension-tester';

describe('EditorView', () => {
    let view: EditorView;

    before(async function() {
        this.timeout(25000);
        view = new EditorView();
        await new Workbench().executeCommand('File: New File');
        await new Promise((res) => { setTimeout(res, 500); });
        await new Workbench().executeCommand('File: New File');
        await new Promise((res) => { setTimeout(res, 500); });
        await new Workbench().executeCommand('Webview Test');
        await new Promise((res) => { setTimeout(res, 2500); });
        await new Workbench().executeCommand('Open Settings UI');
        await new Promise((res) => { setTimeout(res, 500); });

        await new Workbench().executeCommand('File: New File');
        await new Promise((res) => { setTimeout(res, 500); });
        await new Workbench().executeCommand('File: New File');
        await new Promise((res) => { setTimeout(res, 500); });
        const editorA = await view.openEditor('Untitled-3') as TextEditor;
        await editorA.setText('a');
        const editorB = await view.openEditor('Untitled-4') as TextEditor;
        await editorB.setText('b');

        await new Workbench().executeCommand('File: Compare Active File With...');
        const quickOpen = new QuickOpenBox();
        await quickOpen.setText('Untitled-3');
        await quickOpen.confirm();
        await new Promise((res) => { setTimeout(res, 500); });

    });

    after(async () => {
        await view.closeAllEditors();
    });

    it('openEditor works with text editor', async () => {
        const editor = await view.openEditor('Untitled-1') as TextEditor;
        expect(editor.getTitle()).equals('Untitled-1');
    });

    it('openEditor works with settings editor', async () => {
        const editor = await view.openEditor('Settings') as SettingsEditor;
        expect(editor.findSetting).not.undefined;
    });

    it('openEditor works with webview editor', async () => {
        const editor = await view.openEditor('Test WebView') as WebView;
        expect(editor.findWebElement).not.undefined;
    });

    it('openEditor works with diff editor', async () => {        
        const diffEditor = await view.openEditor('b ↔ a') as DiffEditor;
        await new Promise((res) => { setTimeout(res, 5000); });
        expect(diffEditor.getTitle()).equals('b ↔ a');
    });

    it('getOpenEditorTitles works', async () => {
        const tabs = await view.getOpenEditorTitles();
        expect(tabs).not.empty;
        expect(tabs).contains('Untitled-1');
        expect(tabs).contains('Untitled-2');
    });

    it('closeEditor works', async () => {
        await view.closeEditor('Untitled-1');
        const tabs = await view.getOpenEditorTitles();
        expect(tabs).not.contains('Untitled-1');
    });
});