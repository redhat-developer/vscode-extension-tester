import * as path from 'path';
import { expect } from 'chai';
import { TextEditor, EditorView, StatusBar, InputBox, ContentAssist, Workbench, FindWidget, VSBrowser, Notification } from "vscode-extension-tester";

describe('ContentAssist', async () => {
    let assist: ContentAssist;
    let editor: TextEditor;

    before(async function() {
        this.timeout(15000);
        await VSBrowser.instance.openResources(path.resolve(__dirname, '..', '..', '..', '..', 'resources', 'test-file.ts'));
        editor = new TextEditor();
    });

    beforeEach(async () => {
        assist = await editor.toggleContentAssist(true) as ContentAssist;
        await new Promise(res => setTimeout(res, 1000));
    });

    after(async () => {
        await new EditorView().closeAllEditors();
    });

    afterEach(async () => {
        await editor.toggleContentAssist(false);
        await new Promise(res => setTimeout(res, 1000));
    });

    it('getItems retrieves the suggestions', async () => {
        const items = await assist.getItems();
        expect(items).not.empty;
    });

    it('getItem retrieves suggestion by text', async function() {
        const item = await assist.getItem('AbortController');
        expect(await item.getLabel()).equals('AbortController');
    });

    it('getItem can find an item beyond visible range', async () => {
        const item = await assist.getItem('Buffer');
        expect(item).not.undefined;
    }).timeout(15000);

    it('hasItem finds items beyond visible range', async () => {
        const exists = await assist.hasItem('CSSRule');
        expect(exists).is.true;
    }).timeout(15000);
});

describe('TextEditor', () => {
    let editor: TextEditor;
    let view: EditorView;

    const testText = process.platform === 'win32' ? `line1\r\nline2\r\nline3` : `line1\nline2\nline3`;

    before(async function() {
        this.timeout(8000);
        await new Workbench().executeCommand('File: New File');
        await new Promise((res) => { setTimeout(res, 1000); });
        view = new EditorView();
        editor = new TextEditor(view);

        await new StatusBar().openLanguageSelection();
        const input = await InputBox.create();
        await input.setText('typescript');
        await input.confirm();
    });

    after(async () => {
        await editor.clearText();
        await view.closeAllEditors();
    });

    it('can get and set text', async () => {
        await editor.setText(testText);
        const text = await editor.getText();
        expect(text).equals(testText);
    });

    it('can get and set text at line', async () => {
        await editor.setTextAtLine(2, 'line5');
        const line = await editor.getTextAtLine(2);
        expect(line).has.string('line5');
    });

    it('can type text at given coordinates', async function() {
        this.timeout(5000);
        await editor.typeTextAt(1, 6, '1');
        const line = await editor.getTextAtLine(1);
        expect(line).has.string('line11');
    });

    it('getCoordinates works', async function() {
        this.timeout(5000);
        await editor.moveCursor(1, 1);

        expect(await editor.getCoordinates()).to.deep.equal([1, 1]);

        const lineCount = await editor.getNumberOfLines();
        const lastLine = await editor.getTextAtLine(lineCount);

        await editor.moveCursor(lineCount, lastLine.length);

        expect(await editor.getCoordinates()).to.deep.equal([lineCount, lastLine.length]);
    });

    it('getNumberOfLines works', async () => {
        const lines = await editor.getNumberOfLines();
        expect(lines).equals(3);
    });

    it('toggleContentAssist works', async function() {
        this.timeout(15000);
        const assist = await editor.toggleContentAssist(true) as ContentAssist;
        expect(await assist.isDisplayed()).is.true;

        await editor.toggleContentAssist(false);
    });

    it('getTab works', async () => {
        const tab = await editor.getTab();
        expect(await tab.getTitle()).equals(await editor.getTitle());
    });

    (process.platform === 'darwin' ? it.skip : it)('formatDocument works', async () => {
        expect(await editor.formatDocument()).not.to.throw;
    });

    describe('searching', () => {
        before(async () => {
            await editor.setText('aline\nbline\ncline\ndline\nnope\neline');
        });

        it('getLineOfText works', async () => {
            const line = await editor.getLineOfText('line');
            expect(line).equals(1);
        });

        it('getLineOfText finds multiple occurrences', async () => {
            const line = await editor.getLineOfText('line', 5);
            expect(line).equals(6);
        });

        it('getLineOfText returns -1 on no line found', async () => {
            const line = await editor.getLineOfText('wat');
            expect(line).equals(-1);
        });

        it('getLineOfText returns last known occurrence if there are fewer than specified', async () => {
            const line = await editor.getLineOfText('line', 15);
            expect(line).equals(6);
        });

        (process.platform === 'darwin' ? it.skip : it)('text can be selected', async () => {
            const text = 'bline';
            await editor.selectText(text);
            expect(await editor.getSelectedText()).equals(text);
        });

        it('selectText errors if given text doesnt exist', async () => {
            const text = 'wat';
            try {
                await editor.selectText(text);
            } catch (err) {
                expect(err.message).has.string(`Text '${text}' not found`);
            }             
        });

        (process.platform === 'darwin' ? it.skip : it)('getSelection works', async () => {
            await editor.selectText('cline');
            const selection = await editor.getSelection();

            expect(selection).not.undefined;

            const menu = await selection.openContextMenu();
            await menu.close();
        });
    });

    describe('find widget', () => {
        let widget: FindWidget;

        before(async () => {
            widget = await editor.openFindWidget();
        });

        after(async () => {
            await widget.close();
        });

        it('toggleReplace works', async () => {
            const height = (await widget.getRect()).height;
            await widget.toggleReplace(true);
            expect((await widget.getRect()).height).to.be.gt(height);
        });

        it('setSearchText works', async () => {
            await widget.setSearchText('line');
            expect(await widget.getSearchText()).equals('line');
        });

        it('setReplaceText works', async () => {
            await widget.setReplaceText('line1');
            expect(await widget.getReplaceText()).equals('line1');
        });

        it('getResultCount works', async () => {
            const count = await widget.getResultCount();
            expect(count[0]).gte(1);
            expect(count[1]).gt(1);
        });

        it('nextMatch works', async () => {
            const count = (await widget.getResultCount())[0];
            await widget.nextMatch();
            expect((await widget.getResultCount())[0]).equals(count + 1);
        });

        it('previousMatch works', async () => {
            const count = (await widget.getResultCount())[0];
            await widget.previousMatch();
            expect((await widget.getResultCount())[0]).equals(count - 1);
        });

        it('replace works', async () => {
            await widget.replace();
            expect(await editor.getLineOfText('line1')).gt(0);
        });

        it('replace all works', async () => {
            const original = await editor.getText();
            await widget.replaceAll();
            expect(await editor.getText()).not.equals(original);
        });

        it('toggleMatchCase works', async () => {
            await widget.toggleMatchCase(true);
        });

        it('toggleMatchWholeWord works', async () => {
            await widget.toggleMatchWholeWord(true);
        });

        it('toggleUseRegularExpression works', async () => {
            await widget.toggleUseRegularExpression(true);
        });

        it('togglePreserveCase works', async () => {
            await widget.togglePreserveCase(true);
        });
    });

    describe('CodeLens', () => {

        before(async () => {
            await new Workbench().executeCommand('enable codelens');
            // older versions of vscode dont fire the update event immediately, give it some encouragement
            // otherwise the lenses end up empty
            await new Workbench().executeCommand('enable codelens');
            await new Promise(res => setTimeout(res, 1000));
        });

        after(async () => {
            await new Workbench().executeCommand('disable codelens');
        });

        it('getCodeLenses works', async () => {
            const lenses = await editor.getCodeLenses();
            expect(lenses).not.empty;
        });

        it('getCodeLens works with index', async () => {
            const lens0 = await editor.getCodeLens(0);
            const lens1 = await editor.getCodeLens(1);

            expect(await lens0.getAttribute('widgetid')).not.equal(await lens1.getAttribute('widgetid'));
        });

        it('getCodeLens works with partial text', async () => {
            const lens = await editor.getCodeLens('Codelens provided');
            expect(await lens.getText()).has.string('Codelens provided');
            expect(await lens.getTooltip()).has.string('Tooltip provided');
        });

        it('getCodeLens returns undefined when nothing is found', async () => {
            const lens1 = await editor.getCodeLens('This does not exist');
            expect(lens1).is.undefined;

            const lens2 = await editor.getCodeLens(666);
            expect(lens2).is.undefined;
        });

        it('clicking triggers the lens command', async () => {
            const lens = await editor.getCodeLens(0);
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