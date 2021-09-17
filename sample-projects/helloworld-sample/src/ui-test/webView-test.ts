import { Workbench, EditorView, WebView, By } from 'vscode-extension-tester';
import { expect } from 'chai';

// An example how to handle a simple web view
describe('Sample WebView Test', () => {

    let view: WebView;

    before(async function() {
        this.timeout(8000);
        // open a sample web view
        await new Workbench().executeCommand('Webview Test');
        await new Promise((res) => { setTimeout(res, 500); });
        // init the WebView page object
        view = new WebView();
        // switch webdriver into the webview iframe, now all webdriver commands are
        // relative to the webview document's root
        // make sure not to try accessing elements outside the web view while switched inside and vice versa
        await view.switchToFrame();
    });

    after(async () => {
        // after we are done with the webview, switch webdriver back to the vscode window
        await view.switchBack();
        await new EditorView().closeAllEditors();
    });

    it('Look for a web element', async () => {
        // now we can use findWebElement to look for elements inside the webview
        const element = await view.findWebElement(By.css('h1'));
        expect(await element.getText()).has.string('This is a web view');
    });

    it('Look for all elements with given locator', async () => {
        // analogically, findWebElements to search for all occurences
        const elements = await view.findWebElements(By.css('h1'));
        expect(elements.length).equals(1);
    });
});