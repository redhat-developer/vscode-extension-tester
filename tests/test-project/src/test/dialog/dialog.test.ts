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
import { satisfies } from 'compare-versions';
import { By, EditorView, InputBox, ModalDialog, TextEditor, until, VSBrowser, after, before, Workbench } from 'vscode-extension-tester';

(satisfies(VSBrowser.instance.version, '>=1.50.0') && process.platform !== 'darwin' ? describe : describe.skip)('Modal Dialog', function () {
	let dialog: ModalDialog;

	before(async function (this: Mocha.Context) {
		this.timeout(30000);
		await new Workbench().executeCommand('Create: New File...');
		await (await InputBox.create(10000)).selectQuickPick('Text File');
		// Wait for the text editor to become active before interacting with it
		await VSBrowser.instance.driver.wait(
			until.elementLocated(By.className('monaco-editor')),
			10000,
			'Text editor did not become active after creating new file',
		);
		const editor = new TextEditor();
		await editor.typeTextAt(1, 1, 'text');
		// Wait for the dirty indicator to confirm the edit was registered
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
		const title = await editor.getTitle();
		await new EditorView().closeEditor(title);
		// Wait for the modal dialog to appear instead of using a fixed sleep
		dialog = new ModalDialog();
		await dialog
			.getDriver()
			.wait(until.elementsLocated(By.className('monaco-dialog-box')), 10000, 'Modal dialog did not appear after closing dirty editor');
	});

	after(async function () {
		// Dismiss any remaining dialog to leave a clean workbench state
		try {
			await dialog.getDriver().wait(until.stalenessOf(dialog), 1000);
		} catch {
			// Dialog may already be gone; attempt to push Don't Save as a fallback
			try {
				await dialog.pushButton(`Don't Save`);
			} catch {
				// Nothing left to clean up
			}
		}
	});

	it('getMessage works', async function () {
		this.timeout(10000);
		const message = await dialog.getMessage();
		expect(message).has.string('Do you want to save the changes');
	});

	it('getDetails works', async function () {
		this.timeout(10000);
		const details = await dialog.getDetails();
		expect(details).has.string('Your changes will be lost');
	});

	it('getButtons works', async function () {
		this.timeout(10000);
		const buttons = await dialog.getButtons();
		expect(buttons.length).equals(3);
	});

	it('pushButton works', async function () {
		this.timeout(10000);
		await dialog.pushButton(`Don't Save`);
		await dialog.getDriver().wait(until.stalenessOf(dialog), 5000);
	});
});
