import { expect } from "chai";
import { EditorView, ModalDialog, TextEditor, TitleBar, until } from "monaco-page-objects";
import { VSBrowser } from 'vscode-extension-tester';

(VSBrowser.instance.version >= '1.50.0' && process.platform != 'darwin' ? describe : describe.skip)('Modal Dialog', () => {
    let dialog: ModalDialog;

    before(async () => {
        await new TitleBar().select('File', 'New File');
        await new Promise(res => setTimeout(res, 1000));
        const editor = new TextEditor();
        await editor.typeText(1, 1, 'text');
        await new EditorView().closeEditor(await editor.getTitle());
        dialog = new ModalDialog();
    });

    after(async () => {
        await new Promise(res => setTimeout(res, 1000));
    });

    it('getMessage works', async () => {
        const message = await dialog.getMessage();
        expect(message).has.string('Do you want to save the changes');
    });

    it('getDetails works', async () => {
        const details = await dialog.getDetails();
        expect(details).has.string('Your changes will be lost');
    });

    it('getButtons works', async () => {
        const buttons = await dialog.getButtons();
        expect(buttons.length).equals(3);
    });

    it('pushButton works', async () => {
        const driver = dialog.getDriver();
        await dialog.pushButton(`Don't Save`);
        await driver.wait(until.stalenessOf(dialog), 2000);
    });
});