import { expect } from 'chai';
import path from 'path';
import { CustomEditor, EditorView, VSBrowser, By, error } from 'vscode-extension-tester';

describe('CustomEditor', () => {
    let editor: CustomEditor;

    before(async () => {
        await VSBrowser.instance.openResources(path.resolve(__dirname, '..', '..', '..', '..', 'resources', 'example.cscratch'));
        editor = new CustomEditor();
    });

    after(async () => {
        await new EditorView().closeAllEditors();
    });

    it('webview is available', async () => {
        const webview = editor.getWebView();
        await webview.switchToFrame();
        try {
            const btn = await webview.findWebElement(By.className('add-button'));
            await btn.click();
            await new Promise(res => setTimeout(res, 1000));
            const notes = await webview.findWebElements(By.className('note'));
            const note = notes[notes.length - 1];
            await webview.getDriver().actions().move({origin:note}).perform();
            await note.findElement(By.className('delete-button')).click();
        } catch(err) {
            // if (!(err instanceof error.StaleElementReferenceError)) {
                expect.fail(err);
            // }
        } finally {
            await webview.switchBack();
        }
    });

    it('isDirty works', async () => {
        expect(await editor.isDirty()).is.true;
    });

    it('save works', async () => {
        await editor.save();
        expect(await editor.isDirty()).is.false;
    });

    it('save as works', async () => {
        try {
            const input = await editor.saveAs();
            expect(await input.isDisplayed()).is.true;
            if (input && await input.isDisplayed()) {
                await input.cancel();
            }
        } catch (err) {
            expect.fail(err);
        }
    });
});