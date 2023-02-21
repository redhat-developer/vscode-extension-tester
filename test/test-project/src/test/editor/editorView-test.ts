import { expect } from 'chai';
import { after, before, EditorView, EditorTab, EditorTabNotFound, error, Workbench, TextEditor, SettingsEditor, WebView, QuickOpenBox, DiffEditor, Key, InputBox, VSBrowser } from 'vscode-extension-tester';

describe('EditorView', function () {
    let view: EditorView;

    before(async function () {
        this.timeout(25000);
        view = new EditorView();
        await newUntitledFile('Untitled-1');
        await newUntitledFile('Untitled-2');
        await new Workbench().executeCommand('Webview Test');
        await view.getDriver().sleep(2500);
        await new Workbench().executeCommand('Open Settings UI');
        await view.getDriver().sleep(500);
    });

    after(async function () {
        await view.closeAllEditors();
    });

    it('openEditor works with text editor', async function () {
        const editor = await view.openEditor('Untitled-1') as TextEditor;
        expect(await editor.getTitle()).equals('Untitled-1');
    });

    it('openEditor works with settings editor', async function () {
        const editor = await view.openEditor('Settings') as SettingsEditor;
        expect(editor.findSetting).not.undefined;
    });

    it('openEditor works with webview editor', async function () {
        let editorTitle: string;
        (await view.getOpenEditorTitles()).forEach(title => {
            if (title.startsWith('Test WebView')) {
                editorTitle = title;
            }
        });
        const editor = await view.openEditor(editorTitle) as WebView;
        expect(editor.findWebElement).not.undefined;
    });

    it('openEditor works with diff editor', async function () {
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
        await quickOpen.getDriver().sleep(500);
        
        const diffEditor = await view.openEditor('Untitled-2 ↔ Untitled-1') as DiffEditor;
        await diffEditor.getDriver().sleep(500);
        expect(await diffEditor.getOriginalEditor()).not.undefined;
        expect(await diffEditor.getModifiedEditor()).not.undefined;
    });

    it('getTabByTitle works', async function () {
        const tab = await view.getTabByTitle('Untitled-1');
        expect(tab).not.undefined;
    });

    it('getOpenEditorTitles works', async function () {
        const tabs = await view.getOpenEditorTitles();
        expect(tabs).not.empty;
        expect(tabs).contains('Untitled-1');
        expect(tabs).contains('Untitled-2');
    });

    it('closeEditor works', async function () {
        await view.closeEditor('Untitled-1');
        const tabs = await view.getOpenEditorTitles();
        expect(tabs).not.contains('Untitled-1');
    });

    it('getActions works', async function () {
        const actions = await view.getActions();
        expect(actions).not.empty;
    });

    it('getAction works', async function () {
        const action = await view.getAction('More Actions...');
        expect(action).not.undefined;
    });

    describe('Editor Tab', function () {
        let tab2: EditorTab;
        let tab3: EditorTab;

        before(async function () {
            await newUntitledFile('Untitled-3');
            tab2 = await view.getTabByTitle('Untitled-2');
            tab3 = await view.getTabByTitle('Untitled-3');
        });

        it('getTitle works', async function () {
            expect(await tab2.getTitle()).equals('Untitled-2');
        });

        it('isSelected works on active tab', async function () {
            expect(await tab3.isSelected()).to.be.true;
        });

        it('isSelected works on inactive tab', async function () {
            expect(await tab2.isSelected()).to.be.false;
        });
    });

    describe('Editor Groups', function () {
        const testFile = 'Untitled-4';
        before(async function () {
            view = new EditorView();
            await newUntitledFile(testFile);
        });

        it('getEditorGroups works', async function () {
            let driverActions = view.getDriver().actions();
            driverActions.clear();
            driverActions.keyDown(EditorView.ctlKey).sendKeys('\\').keyUp(EditorView.ctlKey).perform();
            await view.getDriver()
                .wait(
                    async () => (await view.getEditorGroups()).length === 2,
                    10000,
                    'could not get 2 editor groups'
                );

            const groups = await view.getEditorGroups();
            const group1 = await view.getEditorGroup(0);
            const group2 = await view.getEditorGroup(1);

            expect(groups.length).equals(2);
            expect((await group1.getRect()).x).equals((await groups[0].getRect()).x);
            expect((await group2.getRect()).x).equals((await groups[1].getRect()).x);
        });

        it('openEditor works for different groups', async function () {
            const editor1 = await view.openEditor(testFile, 0);
            const editor2 = await view.openEditor(testFile, 1);

            expect((await editor1.getRect()).x < (await editor2.getRect()).x);
        });

        it('closeEditor works for different groups', async function () {
            await view.getDriver().actions().keyDown(EditorView.ctlKey).sendKeys('\\').perform();
            await view.getDriver().sleep(500);

            await view.closeEditor(testFile, 2);
            expect((await view.getEditorGroups()).length).equals(2);
        });

        it('getOpenEditorTitles works for different editor groups', async function () {
            const titles = await view.getOpenEditorTitles();
            const titles1 = await view.getOpenEditorTitles(0);
            const titles2 = await view.getOpenEditorTitles(1);

            const allTitles = [...titles1, ...titles2];
            expect(titles).deep.equals(allTitles);
        });
    });

    async function newUntitledFile(title?: string, group?: number, timeout: number = 10000): Promise<void> {
        await new Workbench().executeCommand('Create: New File...');
        await (await InputBox.create()).selectQuickPick('Text File');
        if (title === undefined) {
            await view.getDriver().sleep(500);
        }
        else {
            let view = new EditorView();
            await view.getDriver().wait(async () => {
                try {
                    return await view.getTabByTitle(title, group);
                } catch (e) {
                    if (e instanceof EditorTabNotFound) {
                        return undefined;
                    }
                    if (e instanceof error.StaleElementReferenceError) {
                        view = new EditorView();
                        return undefined;
                    }
                    throw e;
                }
            }, timeout, `could not find tab with title '${title}' in group '${group}'`);
        }
    }
});
