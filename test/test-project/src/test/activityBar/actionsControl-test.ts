import { expect } from 'chai';
import { ActivityBar, ActionsControl } from 'vscode-extension-tester';

(process.platform === 'darwin' ? describe.skip : describe)('ActionsControl', () => {
    let bar: ActivityBar;
    let control: ActionsControl;

    before(async function() {
        bar = new ActivityBar();
        control = bar.getGlobalAction('Manage');
    });

    it('openActionsMenu displays context menu', async () => {
        const menu = await control.openActionMenu();
        expect(await menu.isDisplayed()).is.true;
        await menu.close();
    });

    it('getTitle returns the action container label', async () => {
        const title = control.getTitle();
        expect(title).equals('Manage');
    });
});