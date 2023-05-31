import { expect } from 'chai';
import { ActivityBar, TitleBar, ContextMenu, TitleBarItem, EditorView, VSBrowser } from '../../../../../out/extester';

(process.platform === 'darwin' ? describe.skip : describe)('TitleBar', function () {
    let bar: TitleBar;

    before(async function () {
        this.timeout(10000);

        bar = new TitleBar();

        // workspace cleanup before tests
        await new EditorView().closeAllEditors();
        await (await new ActivityBar().getViewControl('Explorer')).closeView();
    });

    after(async function () {
        this.timeout(10000);
        await new EditorView().closeAllEditors();
    });

    it('getTitle returns the window title', async function() {
        const title = await bar.getTitle();
        expect(title).not.empty;
        expect(title).has.string('Visual Studio Code');
    });

    it('getWindowControls works', async function () {
        const controls = bar.getWindowControls();
        expect(controls).not.undefined;
    });

    it('getItem returns an item with the given name', async function () {
        const item = await bar.getItem('File');
        expect(item.getLabel()).equals('File');
    });

    it('getItems returns all top menu items', async function () {
        this.timeout(4000);
        const items = (await bar.getItems()).map((item) => { return item.getLabel(); });
        expect(items.length).greaterThan(5);

        let lastVisibleMenuItem = 'Help';
        if(VSBrowser.instance.version >= '1.75.0') {
            lastVisibleMenuItem = 'More';
        }
        expect(items).contains.members(['File', 'Edit', 'Selection', 'View', lastVisibleMenuItem]);
    });

    it('hasItem returns true if item exists', async function () {
        const exists = await bar.hasItem('File');
        expect(exists).is.true;
    });

    it('hasItem returns false if item does not exist', async function () {
        const exists = await bar.hasItem('whatever1234');
        expect(exists).is.false;
    });

    it('select opens a context menu if the item has children', async function () {
        const menu = (await bar.select('File')) as ContextMenu;
        expect(await menu.isDisplayed()).is.true;
        await menu.close();
    });

    it('select navigates a multi level path', async function () {
        const menu = (await bar.select('File', 'Open Recent', 'Reopen Closed Editor')) as ContextMenu;
        expect(menu).is.undefined;
    });

    describe('TitleBarItem', function () {
        let item: TitleBarItem;

        before(async function () {
            item = await bar.getItem('File');
        });

        it('getParent returns the title bar', async function() {
            const parent = await item.getParent();
            expect(parent).equals(bar);
        });

        it('getLabel returns the item label', async function () {
            const label = await item.getLabel();
            expect(label).equals('File');
        });

        it('select open the item', async function () {
            const menu = await item.select();
            expect(await menu.isDisplayed()).is.true;
            await menu.close();
        });
    });
});