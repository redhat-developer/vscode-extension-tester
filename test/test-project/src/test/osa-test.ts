import { EditorView, MacTitleBar, OutputView } from "vscode-extension-tester";

describe('osascript test', () => {
    it('opens a file', async () => {
        await new Promise(res => setTimeout(res, 2000));
        MacTitleBar.select('File', 'New File');
        const view = new EditorView();
        console.log(await view.getOpenEditorTitles());
    }).timeout(15000);

    it('opens a view', async () => {
        MacTitleBar.select('View', 'Output');
        const output = new OutputView();
        console.log(await output.getText());
    });

    it('nested menu', async () => {
        await new Promise(res => setTimeout(res, 2000));
        MacTitleBar.select('Code', 'Preferences', 'Settings');
        const view = new EditorView();
        console.log(await view.getOpenEditorTitles());
    })
});