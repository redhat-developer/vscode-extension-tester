import { ActivityBar, ExtensionsViewSection, EditorView, ExtensionsViewItem } from "vscode-extension-tester";
import { expect } from 'chai';

describe('ExtensionsView', () => {
    let section: ExtensionsViewSection;
    let item: ExtensionsViewItem;

    before(async () => {
        const view = await new ActivityBar().getViewControl('Extensions').openView();
        section = await view.getContent().getSection('Recommended') as ExtensionsViewSection;
    });

    after(async function()  {
        await new ActivityBar().getViewControl('Extensions').closeView();
        await new EditorView().closeAllEditors();
    });

    it('getTitle works', async () => {
        const title = await section.getTitle();
        expect(title).equals('Recommended');
    });

    it('getVisibleItems works', async () => {
        const items = await section.getVisibleItems();
        expect(items).not.undefined;
    });

    it('findItem works', async function() {
        this.timeout(10000);
        item = await section.findItem('colorize') as ExtensionsViewItem;
        expect(item).not.undefined;
    });

    describe('ExtensionsViewItem', async () => {

        after(async () => {
            await section.clearSearch();
        });

        it('getTitle works', async () => {
            const title = item.getTitle();
            expect(title).equals('colorize');
        });

        it('getVersion works', async () => {
            const version = await item.getVersion();
            expect(version).matches(/\d+\.\d+\.\d+/);
        });

        it('getAuthor works', async () => {
            const author = await item.getAuthor();
            expect(author).not.empty;
        });

        it('getDescription works', async () => {
            const desc = await item.getDescription();
            expect(desc).not.empty;
        });

        it('isInstalled works', async () => {
            const installed = await item.isInstalled();
            expect(installed).is.false;
        });

        it('manage works', async () => {
            try {
                await item.manage();
                expect.fail();
            } catch (err) {
                expect(err.message).has.string(`Extension 'colorize' is not installed`);
            }
        });
    });
});