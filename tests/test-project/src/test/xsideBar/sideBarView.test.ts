import * as path from 'path';
import { expect } from 'chai';
import { SideBarView, ActivityBar, ViewTitlePart, Workbench, ViewItem, ViewContent, DefaultTreeSection, DefaultTreeItem, TextEditor, EditorView, VSBrowser } from 'vscode-extension-tester';

describe('SideBarView', () => {
    let view: SideBarView;

    before(async () => {
        view = await (await new ActivityBar().getViewControl('Explorer')).openView();
    });

    after(async () => {
        await (await new ActivityBar().getViewControl('Explorer')).closeView();
    });

    it('getTitlePart works', async () => {
        const titlePart = await view.getTitlePart().wait();
        expect(titlePart).not.undefined;
    });

    it('getContent works', async () => {
        const content = await view.getContent().wait();
        expect(content).not.undefined;
    });

    describe('ViewTitlePart', async () => {
        let part: ViewTitlePart;

        before(async () => {
            part = view.getTitlePart();
        });

        it('getTitle works', async () => {
            const title = await part.getTitle();
            expect(title.toLowerCase()).equals('explorer');
        });

        it('getActions works', async () => {
            const actions = await part.getActions();
            if (VSBrowser.instance.version >= '1.47.0') {
                expect(actions).not.empty;
            } else {
                expect(actions).empty;
            }
        });
    });

    describe('ViewContent', async () => {
        let content: ViewContent;

        before(async function() {
            this.timeout(15000);
            await VSBrowser.instance.openResources(path.resolve(__dirname, '..', '..', '..', 'resources', 'test-folder'));
            view = await (await new ActivityBar().getViewControl('Explorer')).openView();
            await new Promise((res) => { setTimeout(res, 1000); });
            content = view.getContent();
        });

        after(async function() {
            this.timeout(15000);
            await new Workbench().executeCommand('close test folder');
            await new Promise((res) => { setTimeout(res, 3000); });
        });

        it('getSections works', async () => {
            const sections = await content.getSections();
            expect(sections).not.empty;
        });

        it('getSection works', async () => {
            const section = await content.getSection('Outline');
            expect(await section.getTitle()).equals('Outline');
        });

        describe('DefaultTreeSection', async () => {
            let section: DefaultTreeSection;

            before(async () => {
                section = await content.getSection('test-folder') as DefaultTreeSection;
            });

            it('getTitle works', async () => {
                const title = await section.getTitle();
                expect(title).equals('test-folder');
            });

            it('collapse/expand works', async () => {
                await section.collapse();
                expect(await section.isExpanded()).is.false;

                await section.expand();
                expect(await section.isExpanded()).is.true;
            });

            it('getVisibleItems works', async () => {
                const items = await section.getVisibleItems();
                expect(items).not.empty;
            });

            it('findItem works', async () => {
                const item = await section.findItem('foo');
                expect(item).not.undefined;
            });

            it('findItem returns undefined when item exists outside its level range', async () => {
                await section.openItem('foolder');
                const item = await section.findItem('bar', 1);
                (await section.findItem('foolder')).collapse();
                expect(item).undefined;
            });

            it('openItem lists available items when part of the path does not exist', async () => {
                const items = ['foo', 'foolder'];
                try {
                    await section.openItem('x', 'y');
                } catch (err) {
                    expect(err.message).to.have.string(`Available items in current directory: [${items.toString()}]`);
                }
            });

            it('openItem returns folders subitems', async () => {
                const items = await section.openItem('foolder') as ViewItem[];
                expect(items.length).equals(1);
            });

            it('openItem returns empty array for files', async () => {
                const items = await section.openItem('foolder', 'bar') as ViewItem[];
                await (await section.findItem('foolder') as DefaultTreeItem).collapse();
                expect(items).empty;
            });

            it('getActions works', async () => {
                const actions = await section.getActions();
                expect(actions).not.empty;
            });

            it('getAction works', async () => {
                const action = await section.getAction('Refresh Explorer');
                expect(await action.getLabel()).equals('Refresh Explorer');
            });

            (process.platform === 'darwin' ? it.skip : it)('moreActions works', async () => {
                const outline = await content.getSection('Outline');
                await outline.expand();
                await outline.getDriver().actions().move({origin:outline}).perform();

                const menu = await outline.moreActions();
                expect(menu).not.undefined;

                if (menu) {
                    await menu.close();
                }
                await outline.collapse();
            });

            describe('DefaultTreeItem', async () => {
                let defaultSection: DefaultTreeSection;
                let item: DefaultTreeItem;

                before(async () => {
                    defaultSection = section as DefaultTreeSection;
                    item = await defaultSection.findItem('foolder') as DefaultTreeItem;
                });

                after(async () => {
                    await new EditorView().closeAllEditors();
                });

                it('getLabel works', async () => {
                    const label = await item.getLabel();
                    expect(label).equals('foolder');
                });

                it('getTooltip works', async () => {
                    const tooltip = await item.getTooltip();
                    expect(tooltip).has.string('foolder');
                });

                it('selecting folders toggles expand state', async () => {
                    expect(await item.isExpanded()).is.false;
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
                    expect(children.length).equals(1);
                });

                it('findChildItem works', async () => {
                    const child = await item.findChildItem('bar');
                    expect(child).not.undefined;
                });

                it('select opens editor for a file', async () => {
                    const foo = await item.findChildItem('bar') as DefaultTreeItem;
                    await foo.select();

                    try {
                        await new TextEditor().wait();
                    } catch (err) {
                        expect.fail('No editor was opened');
                    }
                });
            });
        });
    });
});