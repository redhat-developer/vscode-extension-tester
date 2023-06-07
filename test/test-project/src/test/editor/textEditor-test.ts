import * as path from 'path';
import { expect } from 'chai';
import { TextEditor, EditorView, StatusBar, InputBox, ContentAssist, Workbench, FindWidget, VSBrowser, Notification, after, before } from "vscode-extension-tester";

describe('ContentAssist', async function () {
    let assist: ContentAssist;
    let editor: TextEditor;

    before(async function () {
        this.timeout(30000);
        await VSBrowser.instance.openResources(path.resolve(__dirname, '..', '..', '..', '..', 'resources', 'test-file.ts'));
        await VSBrowser.instance.waitForWorkbench();
        await new Promise(res => setTimeout(res, 2000));
        const ew = new EditorView();
        try {
            await ew.closeEditor('Welcome');
        } catch (error) {
            // continue - Welcome page is not displayed
        }
        editor = await ew.openEditor('test-file.ts') as TextEditor;
        await editor.getDriver().wait(async function () {
            const progress = await new StatusBar().getItem('Initializing JS/TS language features');
            if(progress) {
                return false;
            } else {
                return true;
            }
        }, this.timeout() - 2000, 'Initializing JS/TS language features was not finished yet!');

    });

    beforeEach(async function () {
        assist = await editor.toggleContentAssist(true) as ContentAssist;
        await new Promise(res => setTimeout(res, 2000));
    });

    after(async function () {
        await new EditorView().closeAllEditors();
    });

    afterEach(async function () {
        await editor.toggleContentAssist(false);
        await new Promise(res => setTimeout(res, 1000));
    });

    it('getItems retrieves the suggestions', async function () {
        const items = await assist.getItems();
        expect(items).not.empty;
    });

    it('getItem retrieves suggestion by text', async function () {
        const item = await assist.getItem('AbortController');
        expect(await item.getLabel()).equals('AbortController');
    });

    it('getItem can find an item beyond visible range', async function () {
        const item = await assist.getItem('Buffer');
        expect(item).not.undefined;
    }).timeout(15000);

    it('hasItem finds items beyond visible range', async function () {
        const exists = await assist.hasItem('CSSRule');
        expect(exists).is.true;
    }).timeout(15000);
});

describe('TextEditor', function () {
    let editor: TextEditor;
    let view: EditorView;

    const testText = process.platform === 'win32' ? `line1\r\nline2\r\nline3` : `line1\nline2\nline3`;

    before(async function () {
        this.timeout(8000);
        await new Workbench().executeCommand('Create: New File...');
        await (await InputBox.create()).selectQuickPick('Text File');
        await new Promise((res) => { setTimeout(res, 1000); });
        view = new EditorView();
        editor = new TextEditor(view);

        await new StatusBar().openLanguageSelection();
        const input = await InputBox.create();
        await input.setText('typescript');
        await input.confirm();
    });

    after(async function () {
        await editor.clearText();
        await view.closeAllEditors();
    });

    it('can get and set text', async function () {
        await editor.setText(testText);
        const text = await editor.getText();
        expect(text).equals(testText);
    });

    it('can get and set text at line', async function () {
        await editor.setTextAtLine(2, 'line5');
        const line = await editor.getTextAtLine(2);
        expect(line).has.string('line5');
    });

    it('can type text at given coordinates', async function () {
        this.timeout(5000);
        await editor.typeTextAt(1, 6, '1');
        const line = await editor.getTextAtLine(1);
        expect(line).has.string('line11');
    });

    it('getCoordinates works', async function () {
        this.timeout(15000);

        await editor.moveCursor(1, 1);
        expect(await editor.getCoordinates()).to.deep.equal([1, 1]);

        const lineCount = await editor.getNumberOfLines();
        const lastLine = await editor.getTextAtLine(lineCount);

        await editor.moveCursor(lineCount, lastLine.length);
        expect(await editor.getCoordinates()).to.deep.equal([lineCount, lastLine.length]);
    });

    it('getNumberOfLines works', async function () {
        const lines = await editor.getNumberOfLines();
        expect(lines).equals(3);
    });

    it('toggleContentAssist works', async function () {
        this.timeout(15000);
        const assist = await editor.toggleContentAssist(true) as ContentAssist;
        expect(await assist.isDisplayed()).is.true;

        await editor.toggleContentAssist(false);
    });

    it('getTab works', async function () {
        const tab = await editor.getTab();
        expect(await tab.getTitle()).equals(await editor.getTitle());
    });

    (process.platform === 'darwin' ? it.skip : it)('formatDocument works', async function () {
        expect(await editor.formatDocument()).not.to.throw;
    });

    describe('searching', function () {

        before(async function () {
            await editor.setText('aline\nbline\ncline\ndline\nnope\neline');
        });

        it('getLineOfText works', async function () {
            const line = await editor.getLineOfText('line');
            expect(line).equals(1);
        });

        it('getLineOfText finds multiple occurrences', async function () {
            const line = await editor.getLineOfText('line', 5);
            expect(line).equals(6);
        });

        it('getLineOfText returns -1 on no line found', async function () {
            const line = await editor.getLineOfText('wat');
            expect(line).equals(-1);
        });

        it('getLineOfText returns last known occurrence if there are fewer than specified', async function () {
            const line = await editor.getLineOfText('line', 15);
            expect(line).equals(6);
        });

        it('selected text can be get', async function () {
            const text = 'bline';
            await editor.selectText(text);
            expect(await editor.getSelectedText()).equals(text);
        });

        it('selectText errors if given text doesnt exist', async function () {
            const text = 'wat';
            try {
                await editor.selectText(text);
            } catch (err) {
                expect(err.message).has.string(`Text '${text}' not found`);
            }             
        });

        (process.platform === 'darwin' ? it.skip : it)('getSelection works', async function () {
            await editor.selectText('cline');
            const selection = await editor.getSelection();

            expect(selection).not.undefined;

            const menu = await selection.openContextMenu();
            await menu.close();
        });
    });

    describe('find widget', function () {
        let widget: FindWidget;

        before(async function () {
            widget = await editor.openFindWidget();
        });

        after(async function () {
            await widget.close();
        });

        it('toggleReplace works', async function () {
            const height = (await widget.getRect()).height;
            await widget.toggleReplace(true);
            expect((await widget.getRect()).height).to.be.gt(height);
        });

        it('setSearchText works', async function () {
            await widget.setSearchText('line');
            expect(await widget.getSearchText()).equals('line');
        });

        it('setReplaceText works', async function () {
            await widget.setReplaceText('line1');
            expect(await widget.getReplaceText()).equals('line1');
        });

        it('getResultCount works', async function () {
            const count = await widget.getResultCount();
            expect(count[0]).gte(1);
            expect(count[1]).gt(1);
        });

        it('nextMatch works', async function () {
            const count = (await widget.getResultCount())[0];
            await widget.nextMatch();
            expect((await widget.getResultCount())[0]).equals(count + 1);
        });

        it('previousMatch works', async function () {
            const count = (await widget.getResultCount())[0];
            await widget.previousMatch();
            expect((await widget.getResultCount())[0]).equals(count - 1);
        });

        it('replace works', async function () {
            await widget.replace();
            expect(await editor.getLineOfText('line1')).gt(0);
        });

        it('replace all works', async function () {
            const original = await editor.getText();
            await widget.replaceAll();
            expect(await editor.getText()).not.equals(original);
        });

        it('toggleMatchCase works', async function () {
            await widget.toggleMatchCase(true);
        });

        it('toggleMatchWholeWord works', async function () {
            await widget.toggleMatchWholeWord(true);
        });

        it('toggleUseRegularExpression works', async function () {
            await widget.toggleUseRegularExpression(true);
        });

        it('togglePreserveCase works', async function () {
            await widget.togglePreserveCase(true);
        });
    });

    describe('CodeLens', function () {

        before(async function () {
            await new Workbench().executeCommand('enable codelens');
            // older versions of vscode dont fire the update event immediately, give it some encouragement
            // otherwise the lenses end up empty
            await new Workbench().executeCommand('enable codelens');
            await new Promise(res => setTimeout(res, 1000));
        });

        after(async function () {
            await new Workbench().executeCommand('disable codelens');
        });

        it('getCodeLenses works', async function () {
            const lenses = await editor.getCodeLenses();
            expect(lenses).not.empty;
        });

        it('getCodeLens works with index', async function () {
            const lens0 = await editor.getCodeLens(0);
            const lens0Duplicate = await editor.getCodeLens(0);
            const lens1 = await editor.getCodeLens(1);

            expect(await lens0.getId()).not.equal(await lens1.getId());
            expect(await lens0.getId()).equal(await lens0Duplicate.getId());
        });

        it('getCodeLens works with partial text', async function () {
            const lens = await editor.getCodeLens('Codelens provided');
            expect(await lens.getText()).has.string('Codelens provided');
            expect(await lens.getTooltip()).has.string('Tooltip provided');
        });

        it('getCodeLens returns undefined when nothing is found', async function () {
            const lens1 = await editor.getCodeLens('This does not exist');
            expect(lens1).is.undefined;

            const lens2 = await editor.getCodeLens(666);
            expect(lens2).is.undefined;
        });

        it('clicking triggers the lens command', async function () {
            const lens = await editor.getCodeLens(2);
            await lens.click();
            await lens.getDriver().sleep(1000);
            const notifications = await new Workbench().getNotifications();
            let notification: Notification;

            for (const not of notifications) {
                if ((await not.getMessage()).startsWith('CodeLens action clicked')) {
                    notification = not;
                    break;
                }
            }
            expect(notification).not.undefined;
        });
    });
});