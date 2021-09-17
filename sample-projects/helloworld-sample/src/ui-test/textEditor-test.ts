import { expect } from 'chai';
import { EditorView, TextEditor, Workbench } from 'vscode-extension-tester';

describe('Text Editor sample tests', () => {
    let editor: TextEditor;

    before(async () => {
        // create a file to open in an editor
        await new Workbench().executeCommand('create new file');
        editor = await new EditorView().openEditor('Untitled-1') as TextEditor;
        // or if the file we want is currently opened we can simply do
        // editor = new TextEditor();
    });

    after(async () => {
        // cleanup, delete the file contents and close the editor
        await editor.clearText();
        await new EditorView().closeAllEditors();
    });

    it('Text manipulation', async () => {
        // the file is currently empty, lets write something in it
        // note the coordinates are (1, 1) for the beginning of the file
        await editor.typeText(1, 1, 'hello');

        // now we can check if the text is correct
        const text = await editor.getText();
        expect(text).equals('hello');

        // we can also replace all the text with whatever we want
        await editor.setText(`line1\nline2\nline3`);
        // assert how many lines there are now
        expect(await editor.getNumberOfLines()).equals(3);

        // get text at the line with given number
        const line = await editor.getTextAtLine(2);
        expect(line).equals('line2');

        // get the line number of a search string
        const lineNum = await editor.getLineOfText('3');
        expect(lineNum).equals(3);

        // the editor should be dirty since we haven't saved yet
        expect(await editor.isDirty()).is.true;

        // another way to set test case timeout, this one also works with arrow functions
    }).timeout(15000);

    it('Content Assist', async () => {
        // we have content assist at our disposal, open it
        const assist = await editor.toggleContentAssist(true);
        // toggle can return void, so we need to make sure the object is present
        if (assist) {
            // get the items visible in the content assist
            const items = await assist.getItems();
            expect(items).not.empty;

            // to select an item use
            // await assist.select('whatever is available')
        }

        // close the assistant again
        await editor.toggleContentAssist(false);
    });
});