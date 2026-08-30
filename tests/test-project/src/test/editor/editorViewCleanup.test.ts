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
import { By, EditorView, InputBox, TextEditor, VSBrowser, Workbench, until } from 'vscode-extension-tester';

// Regression guard: a dirty editor makes VS Code raise a modal "save changes?"
// dialog when the tab is closed. closeAllEditors() must discard those changes so
// the editor actually closes and no leftover modal is left to intercept clicks in
// subsequent tests (which otherwise cascades an entire suite into failure).
describe('EditorView.closeAllEditors with a dirty editor', function () {
	this.timeout(60000);

	beforeEach(async function () {
		await new EditorView().closeAllEditors();
		await new Workbench().executeCommand('Create: New File...');
		await (await InputBox.create(10000)).selectQuickPick('Text File');
		await VSBrowser.instance.driver.wait(until.elementLocated(By.className('monaco-editor')), 10000, 'Text editor did not become active');
		const editor = new TextEditor();
		await editor.typeTextAt(1, 1, 'unsaved content');
		await VSBrowser.instance.driver.wait(
			async () => {
				try {
					return await editor.isDirty();
				} catch {
					return false;
				}
			},
			5000,
			'Editor did not become dirty after typing',
		);
	});

	afterEach(async function () {
		// Make sure a failed run cannot leak a modal into the rest of the suite.
		await new EditorView().closeAllEditors();
	});

	it('closes the dirty editor and leaves no blocking modal dialog', async function () {
		await new EditorView().closeAllEditors();

		const remaining = await new EditorView().getOpenEditorTitles();
		expect(remaining, 'a dirty editor was left open after closeAllEditors').to.have.lengthOf(0);

		const modals = await VSBrowser.instance.driver.findElements(By.className('monaco-dialog-modal-block'));
		expect(modals, 'a save-changes modal was left blocking the workbench').to.have.lengthOf(0);
	});
});
