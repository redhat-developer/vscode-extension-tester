import { expect } from 'chai';
import { StatusBar, EditorView, InputBox, QuickOpenBox, Workbench } from 'vscode-extension-tester';

describe('StatusBar', () => {
    let bar: StatusBar;

    before(async () => {
        await new Workbench().executeCommand('File: New File');
        bar = new StatusBar();
    });

    after(async() => {
        await new EditorView().closeAllEditors();
    });

    it('can open and close the notification center', async () => {
        const center = await bar.openNotificationsCenter();
        expect(await center.isDisplayed()).is.true;

        await bar.closeNotificationsCenter();
        expect(await center.isDisplayed()).is.false;
    });

    it('openLanguageSelection works', async () => {
        await bar.openLanguageSelection();
        const input = await InputBox.create();
        expect(await input.getPlaceHolder()).equals('Select Language Mode');
        await input.cancel();
    });

    it('getCurrentLanguage returns editor mode', async () => {
        const mode = await bar.getCurrentLanguage();
        expect(mode).equals('Plain Text');
    });

    it('openLineEndingSelection works', async () => {
        await bar.openLineEndingSelection();
        const input = await InputBox.create();
        expect(await input.getPlaceHolder()).equals('Select End of Line Sequence');
        await input.cancel();
    });

    it('getCurrentLineEnding returns current line ending', async () => {
        const lf = await bar.getCurrentLineEnding();
        expect('CRLF').has.string(lf);
    });

    it('openEncodingSelection works', async () => {
        await bar.openEncodingSelection();
        const input = await InputBox.create();
        expect(await input.getPlaceHolder()).equals('Select File Encoding to Save with');
        await input.cancel();
    });

    it('getCurrentEncoing returns current encoding', async () => {
        const encoding = await bar.getCurrentEncoding();
        expect(encoding).has.string('UTF-8');
    });

    it('openIndentationSelection works', async () => {
        await bar.openIndentationSelection();
        const input = await InputBox.create();
        expect(await input.getPlaceHolder()).equals('Select Action');
        await input.cancel();
    });

    it('getCurrentIndentation returns current indent setting', async () => {
        const encoding = await bar.getCurrentIndentation();
        expect(encoding).has.string('Spaces: 4');
    });

    it('openLineSelection works', async () => {
        await bar.openLineSelection();
        const input = await QuickOpenBox.create();
        expect(await input.isDisplayed()).is.true;
        await input.cancel();
    });

    it('getCurrentPosition returns current editor coordinates', async () => {
        const encoding = await bar.getCurrentPosition();
        expect(encoding).has.string('Ln 1, Col 1');
    });
});