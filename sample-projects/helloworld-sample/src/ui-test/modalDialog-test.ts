import { expect } from 'chai';
import { EditorView, ModalDialog, TextEditor, Workbench } from 'vscode-extension-tester';

// Example of handling a modal dialog
describe('Sample Modal Dialog Tests', () => {
    let dialog: ModalDialog;
    
    before(async () => {
        // we need to open some modal dialog first, so lets try to close an unsaved file
        // create a new file
        await new Workbench().executeCommand('create new file');
        // make some changes
        const editor = new TextEditor();
        await editor.typeText(1, 1, 'text');
        // try to close the editor unsaved, which opens a modal dialog
        await new EditorView().closeEditor(await editor.getTitle());
        dialog = new ModalDialog();
    });

    // now we can check what the dialog says
    it('Get the message', async () => {
        const message = await dialog.getMessage();

        expect(message).contains('Do you want to save the changes you made');
    });

    // and the additional details
    it('Get the details', async () => {
        const details = await dialog.getDetails();

        expect(details).equals(`Your changes will be lost if you don't save them.`);
    });

    // we can also find and use the buttons on the dialog
    it('Use the buttons', async () => {
        const buttons = await dialog.getButtons();

        // there should be 3 of them
        expect(buttons.length).equals(3);

        // or we can directly push a button by title
        await dialog.pushButton(`Don't Save`);
    });
});