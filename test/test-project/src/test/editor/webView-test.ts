import { Workbench, EditorView, WebView, By } from 'vscode-extension-tester';
import { expect } from 'chai';

describe('WebView', () => {

    let view: WebView;

    before(async function() {
        this.timeout(8000);
        await new Workbench().executeCommand('Webview Test');
        await new Promise((res) => { setTimeout(res, 500); });
        view = new WebView();
        await view.switchToFrame();
    });

    after(async () => {
        await view.switchBack();
        await new EditorView().closeAllEditors();
    });

    it('findWebElement works', async () => {
        const element = await view.findWebElement(By.css('h1'));
        expect(await element.getText()).has.string('This is a web view');
    });

    it('findWebElements works', async () => {
        const elements = await view.findWebElements(By.css('h1'));
        expect(elements.length).equals(1);
    });
});