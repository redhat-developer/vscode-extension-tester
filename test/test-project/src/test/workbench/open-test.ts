import { EditorView, InputBox, TitleBar } from 'monaco-page-objects';
import * as path from 'path';

describe('Simple open file dialog', () => {
    const filePath = path.resolve('.', 'package.json');

    it('Opens a file', async () => {
        await new TitleBar().select('File', 'Open File...');

        const input = await InputBox.create();
        await input.setText(filePath);
        await input.confirm();
        await new Promise(res => setTimeout(res, 2000));

        console.log(await new EditorView().getOpenEditorTitles());
        await new EditorView().openEditor('package.json')
    });
});