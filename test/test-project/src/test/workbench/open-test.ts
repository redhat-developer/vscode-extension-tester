import { EditorView, InputBox, Workbench } from 'monaco-page-objects';
import * as path from 'path';

describe('Simple open file dialog', () => {
    const filePath = path.resolve('.', 'package.json');

    it('Opens a file', async () => {
        await new Workbench().executeCommand('file: open file');
        const input = await InputBox.create();
        console.log(filePath.slice(1, filePath.length))
        await input.setText(filePath);
        await input.confirm();
        await new Promise(res => setTimeout(res, 1000));

        await new EditorView().openEditor('package.json')
    });
});