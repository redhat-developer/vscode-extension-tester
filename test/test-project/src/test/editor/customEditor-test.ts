import { expect } from 'chai';
import path from 'path';
import { CustomEditor, EditorView, VSBrowser } from 'vscode-extension-tester';

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
        let source = '';
        await webview.switchToFrame();
        try {
            source = await webview.getDriver().getPageSource();
        } catch(err) {
            // ignore
        } finally {
            await webview.switchBack();
            expect(source).has.string('<title>Cat Scratch</title>');
        }
    });

    it('isDirty works', async () => {
        expect(await editor.isDirty()).is.false;
    });

    it('save works', async () => {
        await editor.save();
    });
});