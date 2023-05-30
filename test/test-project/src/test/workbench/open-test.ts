import { EditorView, Workbench } from 'monaco-page-objects';
import * as path from 'path';

describe('Simple open file dialog', function () {

    const filePath = path.resolve('.', 'package.json');

    it('Opens a file', async function () {
        this.timeout(30000);
        const input = await new Workbench().openCommandPrompt();
        await input.setText('>File: Open File...');
        await input.selectQuickPick('File: Open File...');
        await new Promise(res => setTimeout(res, 1000));
        await input.setText(filePath);
        await input.confirm();
        await new Promise(res => setTimeout(res, 1000));

        await new EditorView().openEditor('package.json');
    });
});