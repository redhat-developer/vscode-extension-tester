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

    it('selectQuickPick works', async () => {
        await input.setText('>hello world');
        await input.selectQuickPick('Hello World');
        expect(await input.isDisplayed()).is.false;
        input = await new Workbench().openCommandPrompt();
    });

    it('can set and retrieve the text', async () => {
        const testText = 'test-text';
        await input.setText(testText);
        const text = await input.getText();
        expect(testText).has.string(text);
    });

    it('getPlaceholder returns placeholder text', async () => {
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

    before(async () => {
        input = await new Workbench().openCommandPrompt();
        await input.setText('>hello world');
        const picks = await input.getQuickPicks();
        item = picks[0];
    });

    it('getText returns label', async () => {
        const text = await item.getText();
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
});

describe('InputBox', () => {
    let input: InputBox;

    before(async () => {
        await new TitleBar().select('File', 'New File');
        await new StatusBar().openLanguageSelection();
        input = await new InputBox().wait();
    });

    after(async() => {
        input.cancel();
        await new EditorView().closeAllEditors();
    });

    it('getMessage works', async () => {
        const message = await input.getMessage();
        expect(message).empty;
    });

    it('hasProgress works', async () => {
        const prog = await input.hasProgress();
        expect(prog).is.false;
    });

    it('getQuickPicks works', async () => {
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