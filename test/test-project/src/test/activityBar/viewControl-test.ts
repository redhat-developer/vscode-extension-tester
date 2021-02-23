import { expect } from 'chai';
import { ActivityBar, ViewControl } from 'vscode-extension-tester';

describe('ViewControl', () => {
    let bar: ActivityBar;
    let control: ViewControl;

    before(async () => {
        bar = new ActivityBar();
        control = bar.getViewControl('Explorer');
    });

    it('openView opens the underlying view', async () => {
        const view = await control.openView();
        const klass = await control.getAttribute('class');

        expect(klass.indexOf('checked')).greaterThan(-1);
        expect(await view.isDisplayed()).is.true;

        const title = await view.getTitlePart().getTitle();
        expect(title.toLowerCase()).equals('explorer');
    });

    it('closeView closes the side bar view', async () => {
        await control.openView();
        await control.closeView();

        const klass = await control.getAttribute('class');
        expect(klass.indexOf('checked')).lessThan(0);
    });

    it('getTitle returns container label', async () => {
        const title = control.getTitle();
        expect(title).equals('Explorer');
    });

    (process.platform === 'darwin' ? it.skip : it)('openContextMenu shows context menu', async () => {
        const menu = await control.openContextMenu();
        expect(await menu.isDisplayed()).is.true;
        await menu.close();
    });
});