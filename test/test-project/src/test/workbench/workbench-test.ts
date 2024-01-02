import { EditorView, Workbench } from 'vscode-extension-tester';

describe('Workbench', () => {
    let bench: Workbench;

    before(() => {
        bench = new Workbench();
    });

    it('getTitleBar returns title bar reference', () => {
        const bar = bench.getTitleBar();
        chai.expect(bar).not.undefined;
    });

    it('getSideBar returns side bar reference', () => {
        const bar = bench.getSideBar();
        chai.expect(bar).not.undefined;
    });

    it('getActivityBar returns activity bar reference', () => {
        const bar = bench.getActivityBar();
        chai.expect(bar).not.undefined;
    });

    it('getStatusBar returns status bar reference', () => {
        const bar = bench.getStatusBar();
        chai.expect(bar).not.undefined;
    });

    it('getBottomBar returns bottom bar reference', () => {
        const bar = bench.getBottomBar();
        chai.expect(bar).not.undefined;
    });

    it('getEditorView returns editor view reference', () => {
        const view = bench.getEditorView();
        chai.expect(view).not.undefined;
    });

    it('openNotificationsCenter works', async () => {
        const center = await bench.openNotificationsCenter();
        await center.getDriver().wait(async () => {
            return await center.isDisplayed();
        }, 5000, 'Notifications center was not displayed properly!');
        await center.close();
    });

    it('openCommandPrompt works', async () => {
        const prompt = await bench.openCommandPrompt();
        chai.expect(await prompt.isDisplayed()).is.true;
        await prompt.cancel();
    });

    it('executeCommand works', async () => {
        await bench.executeCommand('Hello World');
        await bench.getDriver().sleep(500);
        const notifications = await bench.getNotifications();
        chai.expect(notifications).not.empty;

        const message = await notifications[0].getMessage();
        chai.expect(message).is.equal('Hello World!');
    });

    it('openSettings opens the settings editor', async function() {
        this.timeout(8000);
        const editor = await bench.openSettings();
        chai.expect(await editor.getTitle()).equals('Settings');
        await new EditorView().closeAllEditors();
    });
});