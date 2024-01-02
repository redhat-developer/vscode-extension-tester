import { BottomBarPanel, WebElement, Workbench, ViewControl, ActivityBar } from 'vscode-extension-tester';

describe('BottomBarPanel', function () {
    let panel: BottomBarPanel;

    before(async function () {
        panel = new BottomBarPanel();
        await (await new Workbench().openNotificationsCenter()).clearAllNotifications();
        await (await new ActivityBar().getViewControl('Explorer') as ViewControl).openView();
    });

    after(async function () {
        await panel.toggle(false);
    });

    it('can be toggled open', async function () {
        await panel.toggle(true);
        chai.expect(await panel.isDisplayed()).is.true;
    });

    it('can be toggled closed', async function () {
        await panel.toggle(true);
        await panel.toggle(false);
        chai.expect(await panel.isDisplayed()).is.false;
    });

    it('can be maximized and restored', async function () {
        this.timeout(20000);
        await panel.toggle(true);
        const initHeight = await getHeight(panel);

        await panel.maximize();
        const maxHeight = await getHeight(panel);
        chai.expect(maxHeight).greaterThan(initHeight);
        await new Promise(res => setTimeout(res, 1000));

        await panel.restore();
        const restoredHeight = await getHeight(panel);
        chai.expect(initHeight).equals(restoredHeight);
    });

    it('can open problems view', async function () {
        const view = await panel.openProblemsView();
        chai.expect(await view.isDisplayed()).is.true;
    });

    it('can open output view', async function () {
        const view = await panel.openOutputView();
        chai.expect(await view.isDisplayed()).is.true;
    });

    it('can open debug console view', async function () {
        const view = await panel.openDebugConsoleView();
        chai.expect(await view.isDisplayed()).is.true;
    });

    it('can open terminal view', async function () {
        const view = await panel.openTerminalView();
        chai.expect(await view.isDisplayed()).is.true;
    });
});

async function getHeight(element: WebElement): Promise<number> {
    const size = await element.getRect();
    return size.height;
}