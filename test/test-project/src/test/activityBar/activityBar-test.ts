import { ActivityBar } from 'vscode-extension-tester';

describe('ActivityBar', () => {
    let bar: ActivityBar;

    before(() => {
        bar = new ActivityBar();
    });

    it('getViewControls finds view containers', async () => {
        const controls = await bar.getViewControls();
        chai.expect(controls.length).greaterThan(0);
    });

    it('getViewControl works with the correct label', async () => {
        const explorer = await bar.getViewControl('Explorer');
        chai.expect(explorer).not.undefined;
    });

    it('getViewControl returns undefined with an invalid label', async () => {
        const item = await bar.getViewControl('whatever');
        chai.expect(item).undefined;
    });

    it('getGlobalActions finds global action containers', async () => {
        const actions = await bar.getGlobalActions();
        chai.expect(actions.length).greaterThan(0);
    });

    it('getGlobalAction finds action container with the given label', async () => {
        const action = await bar.getGlobalAction('Manage');
        chai.expect(action).not.undefined;
    });

    it('getGlobalAction returns undefined with nonexistent label', async () => {
        const action = await bar.getGlobalAction('whatever');
        chai.expect(action).undefined;
    });

    (process.platform === 'darwin' ? it.skip : it)('openContextMenu shows context menu', async () => {
        const menu = await bar.openContextMenu();
        chai.expect(await menu.isDisplayed()).is.true;
        await menu.close();
    });
});