import { ActivityBar, ExtensionsViewSection, EditorView, ExtensionsViewItem, VSBrowser } from "vscode-extension-tester";
import { expect } from 'chai';
import pjson from '../../../package.json';

describe('ExtensionsView', () => {
    let section: ExtensionsViewSection;
    let item: ExtensionsViewItem;

    let sectionTitle = 'Enabled';
    if (VSBrowser.browserName === 'vscode' && VSBrowser.instance.version >= '1.48.0') {
        sectionTitle = 'Installed'
    }

    before(async () => {
        const view = await (await new ActivityBar().getViewControl('Extensions')).openView();
        section = await view.getContent().getSection(sectionTitle) as ExtensionsViewSection;
    });

    after(async function()  {
        await (await new ActivityBar().getViewControl('Extensions')).closeView();
        await new EditorView().closeAllEditors();
    });

    it('getTitle works', async () => {
        const title = await section.getTitle();
        expect(title).equals(sectionTitle);
    });

    it('getVisibleItems works', async () => {
        const items = await section.getVisibleItems();
        expect(items).not.undefined;
    });

    it('findItem works', async function() {
        this.timeout(10000);
        item = await section.findItem(`@installed ${pjson.displayName}`) as ExtensionsViewItem;
        expect(item).not.undefined;
    });

    describe('ExtensionsViewItem', async () => {

        after(async () => {
            await section.clearSearch();
        });

        it('getTitle works', async () => {
            const title = await item.getTitle();
            expect(title).equals(pjson.displayName);
        });

        it('getVersion works', async () => {
            const version = await item.getVersion();
            expect(version).equals(pjson.version);
        });

        it('getAuthor works', async () => {
            const author = await item.getAuthor();
            expect(author).equals(pjson.publisher);
        });

        it('getDescription works', async () => {
            const desc = await item.getDescription();
            expect(desc).equals(pjson.description);
        });

        it('isInstalled works', async () => {
            const installed = await item.isInstalled();
            expect(installed).is.true;
        });

        (process.platform === 'darwin' ? it.skip : it)('manage works', async () => {
            const menu = await item.manage();
            expect(menu).not.undefined;
            await menu.close();
        });
    });
});