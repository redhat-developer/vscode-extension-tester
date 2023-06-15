import { expect } from 'chai';
import { BottomBarPanel, By, WebviewView, Workbench } from 'vscode-extension-tester';

describe('WebviewView', function () {

    let webviewView: InstanceType<typeof WebviewView>;

    before(async function () {
        await new Workbench().executeCommand('My Panel: Focus on My Panel View View');
    });

    after(async function () {
        if (webviewView) {
            await webviewView.switchBack();
            webviewView = undefined;
        }
        await new BottomBarPanel().toggle(false);
    });

    it('contains apple and banana', async () => {
        webviewView = new WebviewView();
        await webviewView.switchToFrame(1000);
        const elts = await webviewView.findWebElements(By.xpath('//div/ul/li'));
        const listContent: string[] = [];
        await Promise.all(elts.map(async elt => {
            listContent.push(await elt.getText());
        }));
        expect(listContent).to.have.length(2);
        expect(listContent).to.contain('Apple');
        expect(listContent).to.contain('Banana');
    });

});