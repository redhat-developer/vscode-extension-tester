import * as path from 'path';
import { expect } from 'chai';
import { TextEditor, EditorView, StatusBar, InputBox, ContentAssist, Workbench } from "vscode-extension-tester";

describe('ContentAssist', async () => {
    let assist: ContentAssist;
    let editor: TextEditor;

    before(async function() {
        this.timeout(15000);
        await new Workbench().executeCommand('extest open file');
        const input = await InputBox.create();
        await input.setText(path.resolve(__dirname, '..', '..', '..', '..', 'resources', 'test-file.ts'));
        await input.confirm();

        await new Promise((res) => { setTimeout(res, 1000); });
        editor = new TextEditor();
        assist = await editor.toggleContentAssist(true) as ContentAssist;
    });

    after(async () => {
        await editor.toggleContentAssist(false);
        await new EditorView().closeAllEditors();
    });

    it('getItems retrieves the suggestions', async function() {
        this.timeout(5000);
        const items = await assist.getItems();
        expect(items).not.empty;
    });

    it('getItem retrieves suggestion by text', async function() {
        this.timeout(5000);
        const item = await assist.getItem('AbortController');
        expect(await item.getLabel()).equals('AbortController');
    });
});

describe('TextEditor', () => {
    let editor: TextEditor;
    let view: EditorView;

    const testText = process.platform === 'win32' ? `line1\r\nline2\r\nline3` : `line1\nline2\nline3`;

    before(async function() {
        this.timeout(8000);
        await new Workbench().executeCommand('File: New File');
        await new Promise((res) => { setTimeout(res, 1000); });
        view = new EditorView();
        editor = new TextEditor(view);

        await new StatusBar().openLanguageSelection();
        const input = await InputBox.create();
        await input.setText('typescript');
        await input.confirm();
    });

    after(async () => {
        await editor.clearText();
        await view.closeAllEditors();
    });

    it('can get and set text', async () => {
        await editor.setText(testText);
        const text = await editor.getText();
        expect(text).equals(testText);
    });

    it('can get and set text at line', async () => {
        await editor.setTextAtLine(2, 'line5');
        const line = await editor.getTextAtLine(2);
        expect(line).has.string('line5');
    });

    it('can type text at given coordinates', async function() {
        this.timeout(5000);
        await editor.typeText(1, 6, '1');
        const line = await editor.getTextAtLine(1);
        expect(line).has.string('line11');
    });

    it('getCoordinates works', async () => {
        await editor.moveCursor(1, 1);
        expect(await editor.getCoordinates()).to.deep.equal([1, 1]);

        const lineCount = await editor.getNumberOfLines();
        const lastLine = await editor.getTextAtLine(lineCount);

        await editor.moveCursor(lineCount, lastLine.length);

        expect(await editor.getCoordinates()).to.deep.equal([lineCount, lastLine.length]);
    })

    it('getNumberOfLines works', async () => {
        const lines = await editor.getNumberOfLines();
        expect(lines).equals(3);
    });

    it('toggleContentAssist works', async function() {
        this.timeout(15000);
        const assist = await editor.toggleContentAssist(true) as ContentAssist;
        expect(await assist.isDisplayed()).is.true;

        await editor.toggleContentAssist(false);
    });

    it('getTab works', async () => {
        const tab = await editor.getTab();
        expect(await tab.getTitle()).equals(await editor.getTitle());
    });
});