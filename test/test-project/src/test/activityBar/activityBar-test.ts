import { expect } from 'chai';
import { ActivityBar } from 'vscode-extension-tester';

describe('ActivityBar', () => {
    let bar: ActivityBar;

    before(() => {
        bar = new ActivityBar();
    });

    it('getViewControls finds view containers', async () => {
        const controls = await bar.getViewControls();
        expect(controls.length).greaterThan(0);
    });

    it('getViewControl works with the correct label', async () => {
        const explorer = await bar.getViewControl('Explorer').wait();
        expect(explorer).not.undefined;
    });

    it('getGlobalActions finds global action containers', async () => {
        const actions = await bar.getGlobalActions();
        expect(actions.length).greaterThan(0);
    });

    it('getGlobalAction finds action container with the given label', async () => {
        const action = await bar.getGlobalAction('Manage').wait();
        expect(action).not.undefined;
    });

    it('openContextMenu shows context menu', async () => {
        const menu = await bar.openContextMenu();
        expect(await menu.isDisplayed()).is.true;
        await menu.close();
    });
});