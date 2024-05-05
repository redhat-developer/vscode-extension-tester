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

import { EditorView, MacTitleBar, OutputView } from 'vscode-extension-tester';
import { AssertionError, expect } from 'chai';

describe.skip('MacTitleBar', () => {
    beforeEach(async () => {
        await new Promise(res => setTimeout(res, 2000));
        await new EditorView().closeAllEditors();
    });

    it('works with a single context menu', async () => {
        MacTitleBar.select('File', 'New File');
        const view = new EditorView();
        expect(await view.getOpenEditorTitles()).to.include('Untitled-1');
    });

    it('works with a different menu', async () => {
        MacTitleBar.select('View', 'Output');
        const output = new OutputView();
        expect(await output.isDisplayed()).to.be.true;
    });

    it('work with a nested submenu', async () => {
        MacTitleBar.select('Code', 'Preferences', 'Settings');
        const view = new EditorView();
        expect(await view.getOpenEditorTitles()).to.include('Settings');
    });

    it('errors when an item does not exist', () => {
        try {
            MacTitleBar.select('File', 'This does not exist');
            expect.fail('no error was produced');
        } catch (err) {
            if (err instanceof AssertionError) {
                throw err;
            }
            expect(err).not.to.be.empty;
        }
    });
});