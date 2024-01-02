import { QuickOpenBox, Workbench, QuickPickItem, InputBox, StatusBar, EditorView, VSBrowser, By } from "vscode-extension-tester";

describe('QuickOpenBox', () => {
    let input: QuickOpenBox;

    before(async () => {
        input = await new Workbench().openCommandPrompt();
    });

    after(async () => {
        await input.cancel();
    });

    it('selectQuickPick works', async function() {
        this.timeout(5000);
        await input.setText('>hello world');
        await input.selectQuickPick('Hello World');
        chai.expect(await input.isDisplayed()).is.false;
        input = await new Workbench().openCommandPrompt();
    });

    it('can set and retrieve the text', async function() {
        this.timeout(5000);
        const testText = 'test-text';
        await input.setText(testText);
        const text = await input.getText();
        chai.expect(testText).has.string(text);
    });

    it('getPlaceholder returns placeholder text', async function() {
        this.timeout(5000);
        await input.setText('');
        const holder = await input.getPlaceHolder();

        let searchString = `Type '?' to get help`;
        if (VSBrowser.instance.version >= '1.44.0') {
            searchString = 'Search files by name';
        }
        chai.expect(holder).has.string(searchString);
    });

    it('hasProgress checks for progress bar', async () => {
        const prog = await input.hasProgress();
        chai.expect(prog).is.false;
    });

    it('getQuickPicks finds quick pick options', async () => {
        await input.setText('>hello world');
        const picks = await input.getQuickPicks();
        chai.expect(picks).not.empty;
    });

    it('findQuickPick works when item exists', async function() {
        this.timeout(150000);
        await input.setText('>');
        const pick = await input.findQuickPick('Workspaces: Add Folder to Workspace...');
        chai.expect(pick).not.undefined;
    });


    it('findQuickPick works when item does not exist', async function() {
        this.timeout(150000);
        await input.setText('>');
        const pick = await input.findQuickPick('thisdoesnot exits definitely');
        chai.expect(pick).undefined;
    });
});

describe('QuickPickItem', () => {
    let item: QuickPickItem;
    let input: QuickOpenBox;

    before(async function() {
        this.timeout(5000);
        input = await new Workbench().openCommandPrompt();
        await input.setText('>hello world');
        const picks = await input.getQuickPicks();
        item = picks[0];
    });

    it('getLabel returns label', async () => {
        const text = await item.getLabel();
        chai.expect(text).not.empty;
    });

    it('getIndex returns the index of the item', () => {
        const index = item.getIndex();
        let expected = 0;
        if (VSBrowser.instance.version < '1.44.0') {
            expected = 1;
        }
        chai.expect(index).equals(expected);
    });

    it('select works', async () => {
        await item.select();
        chai.expect(await input.isDisplayed()).is.false;
    });

    it('getDescription works', async function() {
        this.timeout(8000);
        await new Workbench().executeCommand('Extension Test Command');
        const inputbox = await InputBox.create();
        const pick = (await inputbox.getQuickPicks())[0];
        const desc = await pick.getDescription();
        chai.expect(desc).has.string('Test Description');
    });
});

describe('InputBox', () => {
    let input: InputBox;

    before(async function () {
        this.timeout(6000);
        await new Workbench().executeCommand('Create: New File...');
        await (await InputBox.create()).selectQuickPick('Text File');
        await new Promise(res => setTimeout(res, 500));
        await new StatusBar().openLanguageSelection();
        input = await InputBox.create();;
    });

    after(async() => {
        input.cancel();
        await new EditorView().closeAllEditors();
    });

    it('text handling works', async function() {
        this.timeout(5000);
        const text = 'text';
        await input.setText(text);
        chai.expect(await input.getText()).equals(text);

        await input.clear();
        chai.expect(await input.getText()).empty;
    });

    it('getMessage works', async () => {
        const message = await input.getMessage();
        chai.expect(message).empty;
    });

    it('hasProgress works', async () => {
        const prog = await input.hasProgress();
        chai.expect(prog).is.false;
    });

    it('getQuickPicks works', async function() {
        this.timeout(4000);
        const picks = await input.getQuickPicks();
        chai.expect(picks).not.empty;
    });

    it('hasError works', async () => {
        const err = await input.hasError();
        chai.expect(err).is.false;
    });

    it('isPassword works', async () => {
        const pass = await input.isPassword();
        chai.expect(pass).is.false;
    });
});

describe('Multiple selection input', () => {
    let input: InputBox;

    before(async () => {
        await new Workbench().executeCommand('Test Quickpicks');
        await new Promise(res => setTimeout(res, 500));
        input = await InputBox.create();
    });

    after(async () => {
        await input.confirm();
    });

    it('Select all works', async () => {
        await input.toggleAllQuickPicks(true);
        const checkbox = await input.findElement(By.css('input'));
        chai.expect(await checkbox.isSelected()).is.true;
    });

    it('Deselect all works', async () => {
        await input.toggleAllQuickPicks(false);
        const checkbox = await input.findElement(By.css('input'));
        chai.expect(await checkbox.isSelected()).is.false;
    });

    it('allows retrieving quickpicks', async () => {
        const [first] = await input.getCheckboxes();
        chai.expect(await first.getText()).equals('test1');
        await first.select();
        const checkbox = await first.findElement(By.css('input'));
        chai.expect(await checkbox.isSelected()).is.true;
    });
});