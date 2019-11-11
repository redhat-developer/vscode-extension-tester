import { expect } from 'chai';
import { TitleBar, ContextMenu } from 'vscode-extension-tester';

describe('ContextMenu', () => {
    let bar: TitleBar;
    let menu: ContextMenu;

    beforeEach(async () => {
        bar = new TitleBar();
        menu = await bar.select('File') as ContextMenu;
    });

    afterEach(async () => {
        await menu.close();
    });

    it('getItems finds all menu items', async function() {
        this.timeout(4000);
        const items = await menu.getItems();
        expect(items).not.empty;
    });

    it('getItem finds an item with the given name', async () => {
        const item = await menu.getItem('New File');
        expect(item).not.undefined;
    });
});