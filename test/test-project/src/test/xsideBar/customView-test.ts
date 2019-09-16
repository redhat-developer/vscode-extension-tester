import { expect } from 'chai';
import { ViewSection, ActivityBar, ViewItem, CustomTreeItem } from 'vscode-extension-tester';

describe('CustomTreeSection', () => {
    let section: ViewSection;

    before(async function() {
        this.timeout(5000);
        const view = await new ActivityBar().getViewControl('Explorer').openView();
        await new Promise((res) => { setTimeout(res, 1000); });
        const content = view.getContent();
        section = await content.getSection('Test View');
    });

    after(async () => {
        await new ActivityBar().getViewControl('Explorer').closeView();
        await new Promise((res) => { setTimeout(res, 1000); });
    });

    it('getTitle works', async () => {
        const title = await section.getTitle();
        expect(title).equals('Test View');
    });

    it('collapse/expand works', async () => {
        await section.collapse();
        expect(await section.isExpanded()).is.false;

        await section.expand();
        expect(await section.isExpanded()).is.true;
    });

    it('getVisibleItems works', async () => {
        const items = await section.getVisibleItems();
        expect(items.length).equals(2);
    });

    it('findItem works', async () => {
        const item = await section.findItem('b');
        expect(item).not.undefined;


        const item1 = await section.findItem('c');
        expect(item1).undefined;
    });

    it('openItem returns subitems', async () => {
        const items = await section.openItem('a') as ViewItem[];
        expect(items.length).equals(2);
    });

    it('openItem returns empty array for leaves', async () => {
        const items = await section.openItem('b', 'ba') as ViewItem[];
        expect(items).empty;
    });

    it('getActions works', async () => {
        const actions = await section.getActions();
        expect(actions).not.empty;
    });

    it('getAction works', async () => {
        const action = await section.getAction('Collapse All');
        expect(action.getLabel()).equals('Collapse All');
    });

    describe('CustomViewItem', () => {
        let item: CustomTreeItem;

        before(async () => {
            item = await section.findItem('a') as CustomTreeItem;
        });

        it('getLabel works', () => {
            const label = item.getLabel();
            expect(label).equals('a');
        });

        it('collapse works', async () => {
            await item.collapse();
            expect(await item.isExpanded()).is.false;
        });

        it('selecting toggles expand state', async () => {
            await item.select();
            expect(await item.isExpanded()).is.true;
            await item.collapse();
            expect(await item.isExpanded()).is.false;
        });

        it('hasChildren works', async () => {
            const children = await item.hasChildren();
            expect(children).is.true;
        });

        it('getChildren works', async () => {
            const children = await item.getChildren();
            expect(children.length).equals(2);
        });

        it('findChildItem works', async () => {
            const child = await item.findChildItem('ab');
            expect(child).not.undefined;
        });
    });
});