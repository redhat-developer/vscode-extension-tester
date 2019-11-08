import { expect } from 'chai';
import { TitleBar, ContextMenu, BottomBarPanel, TitleBarItem } from 'vscode-extension-tester';

describe('TitleBar', () => {
    let bar: TitleBar;

    before(async () => {
        bar = new TitleBar();
    });

    it('getTitle returns the window title', async () => {
        const title = await bar.getTitle();
        expect(title).not.empty;
        expect(title).has.string('Visual Studio Code');
    });

    it('getWindowControls works', async () => {
        const controls = bar.getWindowControls();
        expect(controls).not.undefined;
    });

    it('getItem returns an item with the given name', async () => {
        const item = await bar.getItem('File');
        expect(item.getLabel()).equals('File');
    });

    it('getItems returns all top menu items', async () => {
        const items = (await bar.getItems()).map((item) => { return item.getLabel(); });
        expect(items.length).greaterThan(5);
        expect(items).contains.members(['File', 'Edit', 'View', 'Help', 'Selection']);
    });

    it('hasItem returns true if item exists', async () => {
        const exists = await bar.hasItem('File');
        expect(exists).is.true;
    });

    it('hasItem returns false if item does not exist', async () => {
        const exists = await bar.hasItem('whatever1234');
        expect(exists).is.false;
    });

    it('select opens a context menu if the item has children', async () => {
        const menu = (await bar.select('File')) as ContextMenu;
        expect(await menu.isDisplayed()).is.true;
        await menu.close();
    });

    it('select navigates a multi level path', async () => {
        const menu = await bar.select('View', 'Appearance', 'Show Panel');
        expect(menu).is.undefined;
        await new BottomBarPanel().toggle(false);
    });

    describe('TitleBarItem', () => {
        let item: TitleBarItem;

        before(async () => {
            item = await bar.getItem('File');
        });

        it('getParent returns the title bar', () => {
            const parent = item.getParent();
            expect(parent).equals(bar);
        });

        it('getLabel returns the item label', () => {
            const label = item.getLabel();
            expect(label).equals('File');
        });

        it('select open the item', async () => {
            const menu = await item.select();
            expect(await menu.isDisplayed()).is.true;
            await menu.close();
        });
    });
});