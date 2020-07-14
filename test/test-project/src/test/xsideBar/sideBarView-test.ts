import * as path from 'path';
import { expect } from 'chai';
import { SideBarView, ActivityBar, ViewTitlePart, Workbench, ViewItem, ViewContent, ViewSection, DefaultTreeSection, DefaultTreeItem, TextEditor, EditorView, InputBox, VSBrowser } from "vscode-extension-tester";

describe('SideBarView', () => {
    let view: SideBarView;

    before(async () => {
        view = await new ActivityBar().getViewControl('Explorer').openView();
    });

    after(async () => {
        await new ActivityBar().getViewControl('Explorer').closeView();
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
            this.timeout(6000);
            await new Workbench().executeCommand('extest open folder');
            const input = await InputBox.create();
            await input.setText(path.resolve(__dirname, '..', '..', '..', '..', 'resources', 'test-folder'));
            await input.confirm();

            view = await new ActivityBar().getViewControl('Explorer').openView();
            await new Promise((res) => { setTimeout(res, 1000); });
            content = view.getContent();
        });

        after(async function() {
            this.timeout(5000);
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
            let section: ViewSection;

            before(async () => {
                section = await content.getSection('Untitled (Workspace)');
            });

            it('getTitle works', async () => {
                const title = await section.getTitle();
                expect(title).equals('Untitled (Workspace)');
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
                const item = await section.findItem('test-folder');
                expect(item).not.undefined;
            });

            it('openItem returns folders subitems', async () => {
                const items = await section.openItem('test-folder', 'foolder') as ViewItem[];
                expect(items.length).equals(1);
            });

            it('openItem returns empty array for files', async () => {
                const items = await section.openItem('test-folder', 'foolder', 'bar') as ViewItem[];
                await (await section.findItem('test-folder') as DefaultTreeItem).collapse();
                expect(items).empty;
            });

            it('getActions works', async () => {
                const actions = await section.getActions();
                expect(actions).not.empty;
            });

            it('getAction works', async () => {
                const action = await section.getAction('Refresh Explorer');
                expect(action.getLabel()).equals('Refresh Explorer');
            });

            describe('DefaultTreeItem', async () => {
                let defaultSection: DefaultTreeSection;
                let item: DefaultTreeItem;

                before(async () => {
                    defaultSection = section as DefaultTreeSection;
                    item = await defaultSection.findItem('test-folder') as DefaultTreeItem;
                });

                after(async () => {
                    await new EditorView().closeAllEditors();
                });

                it('getLabel works', () => {
                    const label = item.getLabel();
                    expect(label).equals('test-folder');
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
                    expect(children.length).equals(2);
                });

                it('findChildItem works', async () => {
                    const child = await item.findChildItem('foo');
                    expect(child).not.undefined;
                });

                it('select opens editor for a file', async () => {
                    const foo = await item.findChildItem('foo') as DefaultTreeItem;
                    await foo.select();

                    try {
                        const editor = new TextEditor().wait();
                    } catch (err) {
                        expect.fail('No editor was opened');
                    }
                });
            });
        });
    });
});