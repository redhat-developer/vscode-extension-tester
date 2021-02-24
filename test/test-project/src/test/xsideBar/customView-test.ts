import { expect } from 'chai';
import { ActivityBar, ViewItem, CustomTreeSection, CustomTreeItem, ViewContent, WelcomeContentButton } from 'vscode-extension-tester';

describe('CustomTreeSection', () => {
    let section: CustomTreeSection;
    let emptyViewSection: CustomTreeSection;
    let content: ViewContent;

    before(async function() {
        this.timeout(5000);
        const view = await new ActivityBar().getViewControl('Explorer').openView();
        await new Promise((res) => { setTimeout(res, 1000); });
        content = view.getContent();
        section = await content.getSection('Test View') as CustomTreeSection;
        emptyViewSection = await content.getSection('Empty View') as CustomTreeSection;
        await emptyViewSection.expand();
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
        expect(items.length).equals(3);
    });

    it('findItem works', async () => {
        const item = await section.findItem('b');
        expect(item).not.undefined;


        const item1 = await section.findItem('d');
        expect(item1).undefined;
    });

    it('openItem returns subitems', async () => {
        const items = await section.openItem('a') as CustomTreeItem[];
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

    it('getAction works', () => {
        const action = section.getAction('Collapse All');
        expect(action.getLabel()).equals('Collapse All');
    });

    it('findWelcomeContent returns undefined if no WelcomeContent is present', async () => {
        expect(await section.findWelcomeContent()).to.equal(undefined);
        expect(await emptyViewSection.findWelcomeContent()).to.not.equal(undefined)
    });

    it('findWelcomeContent returns the section', async () => {
        const welcomeContent = await emptyViewSection.findWelcomeContent();
        const buttons = await welcomeContent.getButtons();
        const textSections = await welcomeContent.getTextSections();

        expect(buttons).to.be.an("array").and.have.length(1);
        expect(textSections).to.be.an("array").and.have.length(3);

        expect(textSections[0]).to.deep.equal("This is the first line");
        expect(textSections[1]).to.deep.equal("This is the second line");
        expect(textSections[2]).to.deep.equal("And yet another line.");

        expect(await buttons[0].getTitle()).to.deep.equal("Add stuff into this View");
    });

    it('getContent returns the buttons and strings in an ordered array', async () => {
        const welcomeContentEntries = await (await emptyViewSection.findWelcomeContent()).getContents();

        expect(welcomeContentEntries).to.be.an("array").and.have.length(4);

        expect(welcomeContentEntries[0]).to.deep.equal("This is the first line");
        expect(welcomeContentEntries[1]).to.not.be.a("string");
        expect(await (welcomeContentEntries[1] as WelcomeContentButton).getText()).to.deep.equal("Add stuff into this View");
        expect(welcomeContentEntries[2]).to.deep.equal("This is the second line");
        expect(welcomeContentEntries[3]).to.deep.equal("And yet another line.");
    })

    describe('WelcomeContentButton', () => {
        it('takeAction executes the command', async () => {
            const buttons = await (await emptyViewSection.findWelcomeContent()).getButtons();
            await buttons[0].click();

            expect(await emptyViewSection.findWelcomeContent()).to.equal(undefined);
        });
    });

    describe('CustomViewItem', () => {
        let item: CustomTreeItem;

        before(async () => {
            item = await section.findItem('a') as CustomTreeItem;
        });

        it('getLabel works', async () => {
            const label = await item.getLabel();
            expect(label).equals('a');
        });

        it('getTooltip works', async () => {
            const tooltip = await item.getTooltip();
            expect(tooltip).equals('Tooltip for a');
        })

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

        it('hasChildren works for expandable elements without children', async () => {
            const cItem = await section.findItem('c');
            expect(await cItem.hasChildren()).is.false;
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