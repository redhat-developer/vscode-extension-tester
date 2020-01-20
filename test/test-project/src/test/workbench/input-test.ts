import { expect } from 'chai';
import { QuickOpenBox, Workbench, QuickPickItem, InputBox, StatusBar, TitleBar, EditorView } from "vscode-extension-tester";

describe('QuickOpenBox', () => {
    let input: QuickOpenBox;

    before(async () => {
        input = await new Workbench().openCommandPrompt();
    });

    after(async () => {
        await input.cancel();
    });

    it('selectQuickPick works', async function() {
        this.timeout(5000);
        await input.setText('>hello world');
        await input.selectQuickPick('Hello World');
        expect(await input.isDisplayed()).is.false;
        input = await new Workbench().openCommandPrompt();
    });

    it('can set and retrieve the text', async function() {
        this.timeout(5000);
        const testText = 'test-text';
        await input.setText(testText);
        const text = await input.getText();
        expect(testText).has.string(text);
    });

    it('getPlaceholder returns placeholder text', async function() {
        this.timeout(5000);
        await input.setText('');
        const holder = await input.getPlaceHolder();
        expect(holder).has.string(`Type '?' to get help`);
    });

    it('hasProgress checks for progress bar', async () => {
        const prog = await input.hasProgress();
        expect(prog).is.false;
    });

    it('getQuickPicks finds quick pick options', async () => {
        await input.setText('>hello world');
        const picks = await input.getQuickPicks();
        expect(picks).not.empty;
    });
});

describe('QuickPickItem', () => {
    let item: QuickPickItem;
    let input: QuickOpenBox;

    before(async function() {
        this.timeout(5000);
        input = await new Workbench().openCommandPrompt();
        await input.setText('>hello world');
        const picks = await input.getQuickPicks();
        item = picks[0];
    });

    it('getLabel returns label', async () => {
        const text = await item.getLabel();
        expect(text).not.empty;
    });

    it('getIndex returns the index of the item', () => {
        const index = item.getIndex();
        expect(index).equals(1);
    });

    it('select works', async () => {
        await item.select();
        expect(await input.isDisplayed()).is.false;
    });

    it('getDescription works', async function() {
        this.timeout(8000);
        await new Workbench().executeCommand('Test Command');
        const inputbox = await InputBox.create();
        const pick = (await inputbox.getQuickPicks())[0];
        const desc = await pick.getDescription();
        expect(desc).has.string('Test Description');
    });
});

describe('InputBox', () => {
    let input: InputBox;

    before(async function () {
        this.timeout(6000);
        await new Workbench().executeCommand('File: New File');
        await new Promise(res => setTimeout(res, 500));
        await new StatusBar().openLanguageSelection();
        input = await InputBox.create();;
    });

    after(async() => {
        input.cancel();
        await new EditorView().closeAllEditors();
    });

    it('text handling works', async function() {
        this.timeout(5000);
        const text = 'text';
        await input.setText(text);
        expect(await input.getText()).equals(text);

        await input.clear();
        expect(await input.getText()).empty;
    });

    it('getMessage works', async () => {
        const message = await input.getMessage();
        expect(message).empty;
    });

    it('hasProgress works', async () => {
        const prog = await input.hasProgress();
        expect(prog).is.false;
    });

    it('getQuickPicks works', async function() {
        this.timeout(4000);
        const picks = await input.getQuickPicks();
        expect(picks).not.empty;
    });

    it('hasError works', async () => {
        const err = await input.hasError();
        expect(err).is.false;
    });

    it('isPassword works', async () => {
        const pass = await input.isPassword();
        expect(pass).is.false;
    });
});