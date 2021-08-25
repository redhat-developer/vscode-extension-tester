import { EditorView, MacTitleBar, OutputView } from "vscode-extension-tester";
import { expect } from 'chai';

describe('MacTitleBar test', () => {
    before(async () => {
        await new Promise(res => setTimeout(res, 2000));
        await new EditorView().closeAllEditors();
    });

    it('works with a single context menu', async () => {
        MacTitleBar.select('File', 'New File');
        const view = new EditorView();
        expect(await view.getOpenEditorTitles()).to.include('Untitled-1');
    });

    it('works with a different menu', async () => {
        MacTitleBar.select('View', 'Output');
        const output = new OutputView();
        expect(await output.isDisplayed()).to.be.true;
    });

    it('work with a nested submenu', async () => {
        MacTitleBar.select('Code', 'Preferences', 'Settings');
        const view = new EditorView();
        expect(await view.getOpenEditorTitles()).to.include('Settings');
    });

    it('errors when an item does not exist', () => {
        try {
            MacTitleBar.select('File', 'This does not exist');
        } catch (err) {
            expect(err).not.to.be.empty;
        }
        expect.fail('no error was produced');
    });
});