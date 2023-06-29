import { ActivityBar, BottomBarPanel, Breakpoint, DebugConsoleView, DebugToolbar, DebugView, EditorView, error, Key, TextEditor, TitleBar, TreeItemNotFoundError, until, VSBrowser, WebDriver, Workbench } from "vscode-extension-tester";
import * as path from 'path';
import { expect } from "chai";

describe('Debugging', () => {
    process.env.NODE = process.execPath;
    const folder = path.resolve(__dirname, '..', '..', '..', '..', '..', 'debug-project');
    let view: DebugView;

    before(async function () {
        this.timeout(30000);
        const browser = VSBrowser.instance;
        await browser.openResources(folder);
        await browser.driver.sleep(5000);
        await browser.openResources(path.join(folder, 'test.js'));
        await browser.driver.sleep(5000);
        view = (await (await new ActivityBar().getViewControl('Run')).openView()) as DebugView;

        // clear notifications center which causes flaky tests from VSCode version 1.75.x
        await (await new Workbench().openNotificationsCenter()).clearAllNotifications();
    });

    after('After cleanup', async function () {
        this.timeout(10000);
        await new EditorView().closeAllEditors();
        await (await new ActivityBar().getViewControl('Run and Debug')).closeView();
        await new BottomBarPanel().toggle(false);
    });

    describe('Debug View', () => {
        it('getLaunchConfiguration works', async () => {
            const config = await view.getLaunchConfiguration();
            expect(config).equals('Test Launch');
        });

        it('getLaunchConfigurations works', async () => {
            const configs = await view.getLaunchConfigurations();
            expect(configs).contains('Test Launch');
            expect(configs).contains('Test Launch2');
        });

        it('selectLaunchConfiguration works', async () => {
            await view.selectLaunchConfiguration('Test Launch2');
            const config = await view.getLaunchConfiguration();
            expect(config).equals('Test Launch2');
        });
    });

    describe('Debug Session', () => {
        let editor: TextEditor;
        let debugBar: DebugToolbar;
        let driver: WebDriver;
        let breakpoint!: Breakpoint;
        const line = 7;

        before(async () => {
            editor = (await new EditorView().openEditor('test.js')) as TextEditor;
            driver = editor.getDriver();
        });

        after(async function () {
            this.timeout(15000);
            await editor.toggleBreakpoint(5);
            if (await debugBar.isDisplayed()) {
                await debugBar.stop();
            }
            await new TitleBar().select('File', 'Close Folder');
            await new Promise(res => setTimeout(res, 5000));
        });

        it('set a breakpoint', async () => {
            const result = await editor.toggleBreakpoint(line);
            expect(result).to.be.true;
        });

        it('start the debug session', async () => {
            await view.start();
            debugBar = await DebugToolbar.create();
            await debugBar.waitForBreakPoint();
        });

        it('TextEditor: getPausedBreakpoint works', async function () {
            breakpoint = await driver.wait<Breakpoint>(async () => await editor.getPausedBreakpoint(), 10000, 'could not find paused breakpoint') as Breakpoint;
        });

        it('Breakpoint: getLineNumber works', async function () {
            expect(await breakpoint.getLineNumber()).equals(line);
        });

        it('Breakpoint: isPaused works', async function () {
            expect(await breakpoint.isPaused()).to.be.true;
        });

        it('VariableSectionItem.getVariableName', async function () {
            const item = await getNumVariable(view, this.timeout() - 2000);
            expect(await item.getVariableName()).equals('num:');
        });

        it('VariableSectionItem.getVariableValue', async function () {
            const item = await getNumVariable(view, this.timeout() - 2000);
            expect(await item.getVariableValue()).equals('5');
        });

        it('VariableSectionItem.getVariableNameTooltip', async function () {
            const item = await getNumVariable(view, this.timeout() - 2000);
            expect(await item.getVariableNameTooltip()).equals('number');
        });

        it('VariableSectionItem.getVariableValueTooltip', async function () {
            const item = await getNumVariable(view, this.timeout() - 2000);
            expect(await item.getVariableValueTooltip()).equals('5');
        });

        it('Variable view: setVariableValue', async function () {
            const item = await getNumVariable(view, this.timeout() - 2000);
            expect(await item.getVariableValue()).equals('5');
            await item.setVariableValue('42');
            expect(await item.getVariableValue()).equals('42');
        });

        it('evaluate an expression', async () => {
            const debugConsole = new DebugConsoleView();
            await debugConsole.setExpression(`console.log('foo')`);
            await debugConsole.evaluateExpression();

            await debugConsole.evaluateExpression(`console.log('bar')`);
            await new Promise(res => setTimeout(res, 1000));

            const text = await debugConsole.getText();
            expect(text).to.have.string('foo');
            expect(text).to.have.string('bar');
        });

        it('check content assist', async () => {
            const debugConsole = new DebugConsoleView();
            await debugConsole.setExpression('i');
            await new Promise(res => setTimeout(res, 1000));
            let assist;
            try {
                assist = await debugConsole.getContentAssist();
            } catch (err) {
                await VSBrowser.instance.driver.actions().keyDown(Key.CONTROL).sendKeys(Key.SPACE).perform();
                assist = await debugConsole.getContentAssist();
            }
            const list = await assist.getItems();

            expect(list).not.to.be.empty;
        });

        it('stop the debug session', async () => {
            await debugBar.stop();
            await editor.getDriver().wait(until.elementIsNotVisible(debugBar));
        });

        it('remove the breakpoint', async () => {
            const result = await editor.toggleBreakpoint(line);
            expect(result).to.be.false;
        });
    });
});

async function getNumVariable(view: DebugView, timeout: number) {
    try {
        return await view.getDriver().wait(async () => {
            try {
                const variablesSection = await view.getVariablesSection();
                await variablesSection?.openItem('Local');
                return await variablesSection.findItem('num:');
            }
            catch (e) {
                if (e instanceof error.StaleElementReferenceError ||
                    e instanceof error.NoSuchElementError ||
                    e instanceof error.ElementNotInteractableError) {
                    return undefined;
                }
                throw e;
            }
        }, timeout, 'could not find num variable');
    }
    catch (e) {
        if (e instanceof error.TimeoutError) {
            console.log('items');
            const variablesSection = await view.getVariablesSection();
            const items = await variablesSection.getVisibleItems();
            for (const item of items) {
                console.log(`Item: ${await item.getLabel().catch(() => '___error')}`);
            }
        }
        throw e;
    }
}
