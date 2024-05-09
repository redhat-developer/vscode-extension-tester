/**
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License", destination); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { expect } from 'chai';
import { EditorView, ModalDialog, TextEditor, Workbench } from 'vscode-extension-tester';

// Example of handling a modal dialog
describe('Sample Modal Dialog Tests', () => {
    let dialog: ModalDialog;
    
    before(async () => {
        // we need to open some modal dialog first, so lets try to close an unsaved file
        // create a new file
        await new Workbench().executeCommand('create new file');
        // make some changes
        const editor = new TextEditor();
        await editor.typeTextAt(1, 1, 'text');
        // try to close the editor unsaved, which opens a modal dialog
        await new EditorView().closeEditor(await editor.getTitle());
        dialog = new ModalDialog();
    });

    // now we can check what the dialog says
    it('Get the message', async () => {
        const message = await dialog.getMessage();

        expect(message).contains('Do you want to save the changes you made');
    });

    // and the additional details
    it('Get the details', async () => {
        const details = await dialog.getDetails();

        expect(details).equals(`Your changes will be lost if you don't save them.`);
    });

    // we can also find and use the buttons on the dialog
    it('Use the buttons', async () => {
        const buttons = await dialog.getButtons();

        // there should be 3 of them
        expect(buttons.length).equals(3);

        // or we can directly push a button by title
        await dialog.pushButton(`Don't Save`);
    });
});