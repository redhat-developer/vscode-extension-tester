import { ActivityBar, DebugConsoleView, DebugToolbar, DebugView, DefaultTreeSection, EditorView, InputBox, TextEditor, TitleBar, until, Workbench } from "vscode-extension-tester";
import * as path from 'path';
import { expect } from "chai";

(process.platform === 'darwin' ? describe.skip : describe)('Debugging', () => {
    process.env.NODE = process.execPath;
    const folder = path.resolve(__dirname, '..', '..', '..', '..', '..', 'debug-project');
    let view: DebugView;

    before(async function() {
        this.timeout(15000);
        await new Workbench().executeCommand('File: Open Folder...')
        const input = await InputBox.create();
        await input.setText(folder);
        await input.confirm();
        await new Promise(res => setTimeout(res, 5000));

        const explorer = await (await new ActivityBar().getViewControl('Explorer')).openView();
        const tree = (await explorer.getContent().getSections())[0] as DefaultTreeSection;
        
        await new Promise(res => setTimeout(res, 1000));
        await (await tree.findItem('test.js')).select();

        view = (await (await new ActivityBar().getViewControl('Run')).openView()) as DebugView;
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
            expect(config).equals('Test Launch2')
        });
    });

    describe('Debug Session', () => {
        let editor: TextEditor;
        let debugBar: DebugToolbar;

        before(async () => {
            editor = (await new EditorView().openEditor('test.js')) as TextEditor;
        });

        after(async function() {
            this.timeout(15000);
            await editor.toggleBreakpoint(5);
            if (await debugBar.isDisplayed()) {
                await debugBar.stop();
            }
            await new TitleBar().select('File', 'Close Folder');
            await new Promise(res => setTimeout(res, 5000));
        });

        it('set a breakpoint', async () => {
            const result = await editor.toggleBreakpoint(6);
            expect(result).to.be.true;
        });

        it('start the debug session', async () => {
            await view.start();
            debugBar = await DebugToolbar.create();
            await debugBar.waitForBreakPoint();
        });

        it('evaluate an expression', async () => {
            const debugConsole = new DebugConsoleView();
            await debugConsole.setExpression(`console.log('foo')`);
            await debugConsole.evaluateExpression();

            await debugConsole.evaluateExpression(`console.log('bar')`);

            const text = await debugConsole.getText();
            expect(text).to.have.string('foo');
            expect(text).to.have.string('bar');
        });

        it('check content assist', async () => {
            const debugConsole = new DebugConsoleView();
            await debugConsole.setExpression('cons');
            await new Promise(res => setTimeout(res, 1000));
            const assist = await debugConsole.getContentAssist();
            const list = await assist.getItems();

            expect(list).not.to.be.empty;
        });

        it('stop the debug session', async () => {
            await debugBar.stop();
            await editor.getDriver().wait(until.elementIsNotVisible(debugBar));
        });

        it('remove the breakpoint', async () => {
            const result = await editor.toggleBreakpoint(6);
            expect(result).to.be.false;
        });
    });
});