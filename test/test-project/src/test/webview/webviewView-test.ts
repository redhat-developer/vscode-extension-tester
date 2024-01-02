import { BottomBarPanel, By, CustomTreeSection, SideBarView, WebviewView, Workbench } from 'vscode-extension-tester';

describe('WebviewViews', function () {

    const params = [
        { title: 'BottomBar', command: 'My Panel: Focus on My Panel View View', closePanel: true, closeSection: false },
        { title: 'SideBar', command: 'Explorer: Focus on My Side Panel View View', closePanel: false, closeSection: true }
    ];

    params.forEach(function (param) {
        describe(`${param.title} WebviewViews`, function () {

            let webviewView: InstanceType<typeof WebviewView>;

            before(async function () {
                await new Workbench().executeCommand(param.command);
                webviewView = new WebviewView();
                await webviewView.switchToFrame(1000);
            });

            after(async function () {
                if (webviewView) {
                    await webviewView.switchBack();
                    webviewView = undefined;
                }
                if(param.closePanel) {
                    await new BottomBarPanel().toggle(false);
                }
                if(param.closeSection) {
                    const section = await new SideBarView().getContent().getSection('My Side Panel View') as CustomTreeSection;
                    await section.collapse();
                }
            });

            it('findWebElement works', async function () {
                const element = await webviewView.findWebElement(By.css('h1'));
                chai.expect(await element.getText()).has.string('Shopping List');
            });

            it('findWebElements works', async function () {
                const elements = await webviewView.findWebElements(By.css('li'));
                chai.expect(elements.length).equals(2);
            });

            it('contains Apple and Banana', async function () {
                const elts = await webviewView.findWebElements(By.xpath('//div/ul/li'));
                const listContent: string[] = [];
                await Promise.all(elts.map(async elt => {
                    listContent.push(await elt.getText());
                }));
                chai.expect(listContent).to.have.length(2);
                chai.expect(listContent).to.contain('Apple');
                chai.expect(listContent).to.contain('Banana');
            });
        });
    });
});
