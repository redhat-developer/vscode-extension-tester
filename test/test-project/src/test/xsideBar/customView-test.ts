import { ActivityBar, CustomTreeItem, CustomTreeSection, NotificationType, TreeItem, VSBrowser, ViewContent, ViewItem, WelcomeContentButton, Workbench } from 'vscode-extension-tester';

describe('CustomTreeSection', () => {
    let section: CustomTreeSection;
    let emptyViewSection: CustomTreeSection;
    let content: ViewContent;

    before(async function() {
        this.timeout(5000);
        const view = await (await new ActivityBar().getViewControl('Explorer')).openView();
        await new Promise((res) => { setTimeout(res, 1000); });
        content = view.getContent();
        section = await content.getSection('Test View');
        emptyViewSection = await content.getSection('Empty View');
        await emptyViewSection.expand();
    });

    after(async () => {
        await (await new ActivityBar().getViewControl('Explorer')).closeView();
        await new Promise((res) => { setTimeout(res, 1000); });
    });

    it('getTitle works', async () => {
        const title = await section.getTitle();
        chai.expect(title).equals('Test View');
    });

    it('collapse/expand works', async () => {
        await section.collapse();
        chai.expect(await section.isExpanded()).is.false;

        await new Promise(res => setTimeout(res, 500));
        await section.expand();
        chai.expect(await section.isExpanded()).is.true;
    });

    it('getVisibleItems works', async function() {
        this.timeout(10000);
        await VSBrowser.instance.driver.wait(async () => {
            const items = await section.getVisibleItems();
            return items.length === 4;
        }, this.timeout() - 1000, `expected: 4; got: ${(await section.getVisibleItems().catch(() => [])).length}`);
    });

    it('findItem works', async () => {
        const item = await section.findItem('b');
        chai.expect(item).not.undefined;

        const item1 = await section.findItem('e');
        chai.expect(item1).undefined;
    });

    it('openItem returns subitems', async () => {
        const items = await section.openItem('a');
        chai.expect(items.length).equals(2);
    });

    it('openItem returns empty array for leaves', async () => {
        const items = await section.openItem('b', 'ba') as ViewItem[];
        chai.expect(items).empty;
    });

    it('getActions works', async () => {
        const actions = await section.getActions();
        chai.expect(actions).not.empty;
    });

    it('getAction works', async () => {
        const action = await section.getAction('Collapse All');
        chai.expect(await action.getLabel()).equals('Collapse All');
    });

    it('findWelcomeContent returns undefined if no WelcomeContent is present', async () => {
        chai.expect(await section.findWelcomeContent()).to.equal(undefined);
        chai.expect(await emptyViewSection.findWelcomeContent()).to.not.equal(undefined);
    });

    it('findWelcomeContent returns the section', async () => {
        const welcomeContent = await emptyViewSection.findWelcomeContent();
        const buttons = await welcomeContent.getButtons();
        const textSections = await welcomeContent.getTextSections();

        chai.expect(buttons).to.be.an("array").and.have.length(1);
        chai.expect(textSections).to.be.an("array").and.have.length(3);

        chai.expect(textSections[0]).to.deep.equal("This is the first line");
        chai.expect(textSections[1]).to.deep.equal("This is the second line");
        chai.expect(textSections[2]).to.deep.equal("And yet another line.");

        chai.expect(await buttons[0].getTitle()).to.deep.equal("Add stuff into this View");
    });

    it('getContent returns the buttons and strings in an ordered array', async () => {
        const welcomeContentEntries = await (await emptyViewSection.findWelcomeContent()).getContents();

        chai.expect(welcomeContentEntries).to.be.an("array").and.have.length(4);

        chai.expect(welcomeContentEntries[0]).to.deep.equal("This is the first line");
        chai.expect(welcomeContentEntries[1]).to.not.be.a("string");
        chai.expect(await (welcomeContentEntries[1] as WelcomeContentButton).getText()).to.deep.equal("Add stuff into this View");
        chai.expect(welcomeContentEntries[2]).to.deep.equal("This is the second line");
        chai.expect(welcomeContentEntries[3]).to.deep.equal("And yet another line.");
    });

    describe('WelcomeContentButton', () => {
        it('takeAction executes the command', async function() {
            this.timeout(10000);
            const buttons = await (await emptyViewSection.findWelcomeContent()).getButtons();
            await buttons[0].click();

            await new Promise(res => setTimeout(res, 500));
            chai.expect(await emptyViewSection.findWelcomeContent()).to.equal(undefined);
        });
    });

    describe('CustomViewItem', () => {
        let item: CustomTreeItem;

        before(async () => {
            await emptyViewSection.collapse();
            item = await section.findItem('a');
        });

        it('getLabel works', async () => {
            const label = await item.getLabel();
            chai.expect(label).equals('a');
        });

        it('getTooltip works', async () => {
            const tooltip = await item.getTooltip();
            chai.expect(tooltip).equals('Tooltip for a');
        });

        it('getDescription works', async () => {
            const description = await item.getDescription();
            chai.expect(description).equals('Description for a');
        });

        it('collapse works', async () => {
            await item.collapse();
            chai.expect(await item.isExpanded()).is.false;
        });

        it('selecting toggles expand state', async () => {
            await item.select();
            chai.expect(await item.isExpanded()).is.true;
            await item.collapse();
            chai.expect(await item.isExpanded()).is.false;
        });

        it('hasChildren works', async () => {
            const children = await item.hasChildren();
            chai.expect(children).is.true;
        });

        it('hasChildren works for expandable elements without children', async () => {
            const cItem = await section.findItem('c');
            chai.expect(await cItem.hasChildren()).is.false;
        });

        it('getChildren works', async () => {
            const children = await item.getChildren();
            chai.expect(children.length).equals(2);
        });

        it('findChildItem works', async () => {
            const child = await item.findChildItem('ab');
            chai.expect(child).not.undefined;
        });

        it('expand works', async () => {
            item = await section.findItem('a');
            await item.collapse();
            chai.expect(await item.isExpanded()).to.equal(false);
            await item.expand();
            chai.expect(await item.isExpanded()).to.equal(true);
        });

        it('expand is idempotent', async () => {
            for (const _i of [1, 2]) {
                await item.expand();
                chai.expect(await item.isExpanded()).to.equal(true);
            }
        });

        describe('tree item with a command', () => {
            let dItem: TreeItem;
            let bench: Workbench;

            before(async () => {
                dItem = await section.findItem('d');
                bench = new Workbench();
            });

            beforeEach(async () => {
                await (await bench.openNotificationsCenter()).clearAllNotifications();
            });

            afterEach(async () => {
                const notifications = await (await bench.openNotificationsCenter()).getNotifications(NotificationType.Error);
                chai.expect(notifications).to.have.length(0);
            });

            it('getChildren does not click on the tree item', async () => {
                chai.expect(await (dItem as CustomTreeItem).getChildren()).to.have.length(2);
                await dItem.collapse();
            });

            it('findChildItem does not click on the tree item', async () => {
                chai.expect(await (dItem as CustomTreeItem).findChildItem("da")).to.not.equal(undefined);
                await dItem.collapse();
            });

            it('findItem does not click on the tree item', async () => {
                chai.expect(await section.openItem('d', 'da')).to.not.equal(undefined);
            });

            it('clicking on the tree item with a command assigned, triggers the command', async () => {
                await dItem.click();
                const errorNotification = await (await bench.openNotificationsCenter()).getNotifications(NotificationType.Error);
                chai.expect(errorNotification).to.have.length(1);
                chai.expect(await errorNotification[0].getMessage()).to.equal("This is an error!");
                await errorNotification[0].dismiss();
            });
        });
    });
});