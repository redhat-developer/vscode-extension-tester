import { TitleBar, ContextMenu, before, beforeEach, VSBrowser } from 'vscode-extension-tester';
import * as path from 'path';

(process.platform === 'darwin' ? describe.skip : describe)('ContextMenu', function () {
    let bar: TitleBar;
    let menu: ContextMenu;

    before(async function () {
        this.timeout(30000);
        await VSBrowser.instance.openResources(path.resolve(__dirname, '..', '..', '..', '..', 'resources', 'test-folder'));
        await VSBrowser.instance.driver.sleep(5000);
    });

    beforeEach(async function () {
        bar = new TitleBar();
        menu = await bar.select('File') as ContextMenu;
    });

    it('getItems finds all menu items', async function () {
        this.timeout(5000);
        const items = await menu.getItems();
        await menu.close();
        chai.expect(items).not.empty;
    });

    it('getItem finds an item with the given name', async function () {
        this.timeout(5000);
        const item = await menu.getItem('New File...');
        await menu.close();
        chai.expect(item).not.undefined;
    });
});
