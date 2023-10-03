import { ActivityBar, BottomBarPanel, Breakpoint, BreakpointSectionItem, DebugConsoleView, DebugToolbar, DebugView, EditorView, error, Key, TextEditor, TitleBar, until, VSBrowser, WebDriver, Workbench } from "vscode-extension-tester";
import * as path from 'path';
import { expect } from "chai";

const line = 7;

describe('Debugging', function () {
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
        it('getLaunchConfiguration works', async function () {
            const config = await view.getLaunchConfiguration();
            expect(config).equals('Test Launch');
        });

        it('getLaunchConfigurations works', async function () {
            const configs = await view.getLaunchConfigurations();
            expect(configs).contains('Test Launch');
            expect(configs).contains('Test Launch2');
        });

        it('selectLaunchConfiguration works', async function () {
            await view.selectLaunchConfiguration('Test Launch2');
            const config = await view.getLaunchConfiguration();
            expect(config).equals('Test Launch2');
        });
    });

    describe('Debug Session', function () {
        let editor: TextEditor;
        let debugBar: DebugToolbar;
        let driver: WebDriver;
        let breakpoint!: Breakpoint;

        before(async function () {
            editor = await new EditorView().openEditor('test.js') as TextEditor;
            driver = editor.getDriver();
        });

        after(async function () {
            this.timeout(15000);
            if (await debugBar.isDisplayed()) {
                await debugBar.stop();
            }
            await new TitleBar().select('File', 'Close Folder');
            await new Promise(res => setTimeout(res, 5000));
        });

        it('set first breakpoint', async function () {
            const result = await editor.toggleBreakpoint(line + 1);
            expect(result).to.be.true;
        });

        it('set second breakpoint', async function () {
            const result = await editor.toggleBreakpoint(line);
            expect(result).to.be.true;
        });

        it('start the debug session', async function () {
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

        it('BreakpointSectionItem.getBreakpoint', async function () {
            const item = await getBreakpointItem(view, this.timeout() - 2000);
            const breakpoint = await item.getBreakpoint();
            expect(breakpoint).not.undefined;
        });

        it('BreakpointSectionItem.isBreakpointEnabled', async function () {
            const item = await getBreakpointItem(view, this.timeout() - 2000);
            expect(await item.isBreakpointEnabled()).to.be.true;
        });

        it('BreakpointSectionItem.setBreakpointEnabled', async function () {
            const item = await getBreakpointItem(view, this.timeout() - 2000);
            const driver = item.getDriver();
            let status = await item.isBreakpointEnabled();

            await item.setBreakpointEnabled(status);
            await driver.wait(
                async () => await item.isBreakpointEnabled() === status,
                this.timeout() - 2000,
                `could not set status from ${status} to ${status}`
            );

            await item.setBreakpointEnabled(!status);
            await driver.wait(
                async () => await item.isBreakpointEnabled() === !status,
                this.timeout() - 2000,
                `could not set status from ${status} to ${!status}`
            );

            await item.setBreakpointEnabled(status);
            await driver.wait(
                async () => await item.isBreakpointEnabled() === status,
                this.timeout() - 2000,
                `could not set status from ${!status} to ${status}`
            );
        });

        it('BreakpointSectionItem.getLabel', async function () {
            const item = await getBreakpointItem(view, this.timeout() - 2000);
            expect(await item.getLabel()).equals('test.js');
        });

        // Currently not supported
        it.skip('BreakpointSectionItem.getBreakpointFilePath', async function () {
            const item = await getBreakpointItem(view, this.timeout() - 2000);
            expect(await item.getBreakpointFilePath()).equals('test.js');
        });

        it('BreakpointSectionItem.getBreakpointLine', async function () {
            const item = await getBreakpointItem(view, this.timeout() - 2000);
            expect(await item.getBreakpointLine()).equals(line);
        });

        it('BreakpointSectionItem.getActionButtons', async function () {
            await VSBrowser.instance.driver.wait(async () => {
                try {
                    const item = await getBreakpointItem(view, this.timeout() - 2000);
                    return (await item.getActionButtons()).length > 0;
                }
                catch (e) {
                    if (e instanceof error.StaleElementReferenceError) {
                        return false;
                    }
                    throw e;
                }
            }, this.timeout() - 2000, 'actions are empty');
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

        it('evaluate an expression', async function () {
            const debugConsole = new DebugConsoleView();
            await debugConsole.setExpression(`console.log('foo')`);
            await debugConsole.evaluateExpression();

            await debugConsole.evaluateExpression(`console.log('bar')`);
            await new Promise(res => setTimeout(res, 1000));

            const text = await debugConsole.getText();
            expect(text).to.have.string('foo');
            expect(text).to.have.string('bar');
        });

        it('check content assist', async function () {
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

        it('stop the debug session', async function () {
            await debugBar.stop();
            await editor.getDriver().wait(until.elementIsNotVisible(debugBar));
        });

        it('remove the second breakpoint', async function () {
            const result = await editor.toggleBreakpoint(line + 1);
            expect(result).to.be.false;
        });

        it('remove the first breakpoint', async function () {
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

async function getBreakpointItem(view: DebugView, timeout: number) {
    try {
        return await view.getDriver().wait(async function () {
            try {
                const breakpointSection = await view.getBreakpointSection();
                return await breakpointSection.findItem(async (item: BreakpointSectionItem) => await item.getBreakpointLine() === line);
            }
            catch (e) {
                if (e instanceof error.StaleElementReferenceError ||
                    e instanceof error.NoSuchElementError ||
                    e instanceof error.ElementNotInteractableError) {
                    return undefined;
                }
                throw e;
            }
        }, timeout, 'could not find breakpoint item');
    }
    catch (e) {
        if (e instanceof error.TimeoutError) {
            console.log('items');
            const variablesSection = await view.getBreakpointSection();
            const items = await variablesSection.getVisibleItems();
            for (const item of items) {
                console.log(`Item: ${await item.getLabel().catch(() => '___error')}`);
            }
        }
        throw e;
    }
}
