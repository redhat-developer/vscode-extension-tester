import { expect } from 'chai';
import { EditorView, EditorTab, Workbench, TextEditor, SettingsEditor, WebView, QuickOpenBox, DiffEditor, Key, InputBox, VSBrowser } from 'vscode-extension-tester';

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
    });

    after(async () => {
        await view.closeAllEditors();
    });

    it('openEditor works with text editor', async () => {
        const editor = await view.openEditor('Untitled-1') as TextEditor;
        expect(await editor.getTitle()).equals('Untitled-1');
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
        await view.openEditor('Untitled-2');

        await new Workbench().executeCommand('File: Compare Active File With...');
        let quickOpen: QuickOpenBox | InputBox;
        if (VSBrowser.instance.version >= '1.44.0') {
            quickOpen = await InputBox.create(); 
        } else {
            quickOpen = await QuickOpenBox.create();
        }
        await quickOpen.setText('Untitled-1');
        await quickOpen.confirm();
        await new Promise((res) => { setTimeout(res, 500); });
        
        const diffEditor = await view.openEditor('Untitled-2 ↔ Untitled-1') as DiffEditor;
        await new Promise((res) => { setTimeout(res, 500); });
        expect(await diffEditor.getOriginalEditor()).not.undefined;
        expect(await diffEditor.getModifiedEditor()).not.undefined;
    });

    it('getTabByTitle works', async () => {
        const tab = await view.getTabByTitle('Untitled-1');
        expect(tab).not.undefined;
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

    it('getActions works', async () => {
        const actions = await view.getActions();
        expect(actions).not.empty;
    });

    it('getAction works', async () => {
        const action = await view.getAction('More Actions...');
        expect(action).not.undefined;
    });

    describe('Editor Tab', () => {
        let tab: EditorTab;

        before(async () => {
            tab = await view.getTabByTitle('Untitled-2');
        });

        it('getTitle works', async () => {
            expect(await tab.getTitle()).equals('Untitled-2');
        });
    });

    describe('Editor Groups', () => {
        before(async function() {
            this.timeout(5000);
            view = new EditorView();
            await new Workbench().executeCommand('File: New File');
            await new Promise((res) => { setTimeout(res, 500); });
        });

        it('getEditorGroups works', async () => {
            let driverActions = view.getDriver().actions();
            driverActions.clear();
            driverActions.keyDown(Key.CONTROL).sendKeys('\\').keyUp(Key.CONTROL).perform();
            
            await new Promise((res) => { setTimeout(res, 500); });
            const groups = await view.getEditorGroups();
            const group1 = await view.getEditorGroup(0);
            const group2 = await view.getEditorGroup(1);

            expect(groups.length).equals(2);
            expect((await group1.getRect()).x).equals((await groups[0].getRect()).x);
            expect((await group2.getRect()).x).equals((await groups[1].getRect()).x);
        });

        it('openEditor works for different groups', async () => {
            const editor1 = await view.openEditor('Untitled-3', 0);
            const editor2 = await view.openEditor('Untitled-3', 1);

            expect((await editor1.getRect()).x < (await editor2.getRect()).x);
        });

        it('closeEditor works for different groups', async () => {
            await view.getDriver().actions().keyDown(EditorView.ctlKey).sendKeys('\\').perform();
            await new Promise((res) => { setTimeout(res, 500); });

            await view.closeEditor('Untitled-3', 2);
            expect((await view.getEditorGroups()).length).equals(2);
        });

        it('getOpenEditorTitles works for different editor groups', async () => {
            const titles = await view.getOpenEditorTitles();
            const titles1 = await view.getOpenEditorTitles(0);
            const titles2 = await view.getOpenEditorTitles(1);

            const allTitles = [...titles1, ...titles2];
            expect(titles).deep.equals(allTitles);
        });
    });
});