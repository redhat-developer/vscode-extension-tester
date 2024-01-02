import { ActivityBar, ExtensionsViewSection, EditorView, ExtensionsViewItem, VSBrowser, beforeEach } from "vscode-extension-tester";
import pjson from '../../../package.json';

describe('ExtensionsView', () => {
    let section: ExtensionsViewSection;
    let item: ExtensionsViewItem;

    let sectionTitle = 'Enabled';
    if (VSBrowser.browserName === 'vscode' && VSBrowser.instance.version >= '1.48.0') {
        sectionTitle = 'Installed';
    }

    before(async () => {
        const view = await (await new ActivityBar().getViewControl('Extensions')).openView();
        await view.getDriver().wait(async function () {
            return (await view.getContent().getSections()).length > 0;
        });
        section = await view.getContent().getSection(sectionTitle) as ExtensionsViewSection;
    });

    after(async function()  {
        await (await new ActivityBar().getViewControl('Extensions')).closeView();
        await new EditorView().closeAllEditors();
    });

    it('getTitle works', async () => {
        const title = await section.getTitle();
        chai.expect(title).equals(sectionTitle);
    });

    it('getVisibleItems works', async () => {
        const items = await section.getVisibleItems();
        chai.expect(items).not.undefined;
    });

    it('findItem works', async function() {
        this.timeout(30000);
        await section.getDriver().wait(async function () {
            item = await section.findItem(`@installed ${pjson.displayName}`) as ExtensionsViewItem;
            return item !== undefined;
        });
        chai.expect(item).not.undefined;
    });

    describe('ExtensionsViewItem', async () => {

        beforeEach(async function () {
            await section.getDriver().wait(async function () {
                item = await section.findItem(`@installed ${pjson.displayName}`) as ExtensionsViewItem;
                return item !== undefined;
            });
        });

        after(async () => {
            await section.clearSearch();
        });

        it('getTitle works', async () => {
            const title = await item.getTitle();
            chai.expect(title).equals(pjson.displayName);
        });

        it('getVersion works', async () => {
            const version = await item.getVersion();
            chai.expect(version).equals(pjson.version);
        });

        it('getAuthor works', async () => {
            const author = await item.getAuthor();
            chai.expect(author).equals(pjson.publisher);
        });

        it('getDescription works', async () => {
            const desc = await item.getDescription();
            chai.expect(desc).equals(pjson.description);
        });

        it('isInstalled works', async () => {
            const installed = await item.isInstalled();
            chai.expect(installed).is.true;
        });

        (process.platform === 'darwin' ? it.skip : it)('manage works', async () => {
            const menu = await item.manage();
            chai.expect(menu).not.undefined;
            await menu.close();
        });
    });
});