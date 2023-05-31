import { expect } from 'chai';
import { EditorView, Workbench } from '../../../../../out/extester';

describe('Workbench', () => {
    let bench: Workbench;

    before(() => {
        bench = new Workbench();
    });

    it('getTitleBar returns title bar reference', () => {
        const bar = bench.getTitleBar();
        expect(bar).not.undefined;
    });

    it('getSideBar returns side bar reference', () => {
        const bar = bench.getSideBar();
        expect(bar).not.undefined;
    });

    it('getActivityBar returns activity bar reference', () => {
        const bar = bench.getActivityBar();
        expect(bar).not.undefined;
    });

    it('getStatusBar returns status bar reference', () => {
        const bar = bench.getStatusBar();
        expect(bar).not.undefined;
    });

    it('getBottomBar returns bottom bar reference', () => {
        const bar = bench.getBottomBar();
        expect(bar).not.undefined;
    });

    it('getEditorView returns editor view reference', () => {
        const view = bench.getEditorView();
        expect(view).not.undefined;
    });

    it('openNotificationsCenter works', async () => {
        const center = await bench.openNotificationsCenter();
        expect(await center.isDisplayed()).is.true;
        await center.close();
    });

    it('openCommandPrompt works', async () => {
        const prompt = await bench.openCommandPrompt();
        expect(await prompt.isDisplayed()).is.true;
        await prompt.cancel();
    });

    it('executeCommand works', async () => {
        await bench.executeCommand('hello world');
        await bench.getDriver().sleep(500);
        const notifications = await bench.getNotifications();
        expect(notifications).not.empty;
    });

    it('openSettings opens the settings editor', async function() {
        this.timeout(8000);
        const editor = await bench.openSettings();
        expect(await editor.getTitle()).equals('Settings');
        await new EditorView().closeAllEditors();
    });
});