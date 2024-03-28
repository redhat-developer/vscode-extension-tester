import { Workbench, EditorView, WebView, By } from 'vscode-extension-tester';
import { expect } from 'chai';

describe('WebViews', function () {

    describe('Single WebView', function () {

        let view: WebView;

        before(async function () {
            this.timeout(8000);
            await new Workbench().executeCommand('Webview Test');
            await new Promise((res) => { setTimeout(res, 500); });
            view = new WebView();
            await view.switchToFrame();
        });

        after(async function () {
            await view.switchBack();
            await new EditorView().closeAllEditors();
        });

        it('findWebElement works', async function () {
            const element = await view.findWebElement(By.css('h1'));
            expect(await element.getText()).has.string('This is a web view');
        });

        it('findWebElements works', async function () {
            const elements = await view.findWebElements(By.css('h1'));
            expect(elements.length).equals(1);
        });
    });

    describe('Several WebViews', function () {

        let view: WebView;
        let tabs: string[];

        before(async function () {
            await new EditorView().closeAllEditors();
        });

        before(async function () {
            this.timeout(30000);

            const workbench = new Workbench();

            await workbench.executeCommand('Webview Test');
            await new Promise((res) => { setTimeout(res, 500); });

            await workbench.executeCommand('Webview Test');
            await new Promise((res) => { setTimeout(res, 500); });

            await workbench.executeCommand('Webview Test');
            await new Promise((res) => { setTimeout(res, 500); });

            tabs = await new EditorView().getOpenEditorTitles();
        });

        after(async function () {
            await new EditorView().closeAllEditors();
        });

        describe('First WebView', function () {

            before(async function () {
                await new EditorView().openEditor(tabs[0]);
            });

            switchToFrame();
            runTests();
            clean();
        });

        describe('Second WebView', async function () {

            before(async function () {
                await new EditorView().openEditor(tabs[1]);
            });

            switchToFrame();
            runTests();
            clean();
        });

        describe('Third WebView', async function () {

            before(async function () {
                await new EditorView().openEditor(tabs[2]);
            });

            switchToFrame();
            runTests();
            clean();
        });

        async function switchToFrame() {
            before(async function () {
                view = new WebView();
                await view.switchToFrame();
            });
        }

        async function runTests() {
            it('findWebElement works', async function () {
                const element = await view.findWebElement(By.css('h1'));
                expect(await element.getText()).has.string('This is a web view');
            });

            it('findWebElements works', async function () {
                const elements = await view.findWebElements(By.css('h1'));
                expect(elements.length).equals(1);
            });
        }

        async function clean() {
            after(async function () {
                await view.switchBack();
            });
        }

    });
});
