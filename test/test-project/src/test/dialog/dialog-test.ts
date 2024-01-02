import { By, EditorView, InputBox, ModalDialog, TextEditor, until, VSBrowser, after, before, Workbench } from 'vscode-extension-tester';

(VSBrowser.instance.version >= '1.50.0' && process.platform !== 'darwin' ? describe : describe.skip)('Modal Dialog', () => {
    let dialog: ModalDialog;

    before(async function () {
        this.timeout(30000);
        await new Workbench().executeCommand('Create: New File...');
        await (await InputBox.create()).selectQuickPick('Text File');
        await new Promise(res => setTimeout(res, 1000));
        const editor = new TextEditor();
        await editor.typeTextAt(1, 1, 'text');
        await new Promise(res => setTimeout(res, 1000));
        await new EditorView().closeEditor(await editor.getTitle());
        await new Promise(res => setTimeout(res, 1000));
        dialog = new ModalDialog();
        await dialog.getDriver().wait(until.elementsLocated(By.className('monaco-dialog-box')), 5000);
    });

    after(async function () {
        await new Promise(res => setTimeout(res, 1000));
    });

    it('getMessage works', async function () {
        this.timeout(10000);
        const message = await dialog.getMessage();
        chai.expect(message).has.string('Do you want to save the changes');
    });

    it('getDetails works', async function () {
        this.timeout(10000);
        const details = await dialog.getDetails();
        chai.expect(details).has.string('Your changes will be lost');
    });

    it('getButtons works', async function () {
        this.timeout(10000);
        const buttons = await dialog.getButtons();
        chai.expect(buttons.length).equals(3);
    });

    it('pushButton works', async function () {
        this.timeout(10000);
        await dialog.pushButton(`Don't Save`);
        await dialog.getDriver().wait(until.stalenessOf(dialog), 2000);
    });
});
