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
import { compareVersions } from 'compare-versions';
import { By, EditorView, InputBox, ModalDialog, TextEditor, until, VSBrowser, after, before, Workbench } from 'vscode-extension-tester';

(compareVersions(VSBrowser.instance.version, '1.50.0') >= 0 && process.platform !== 'darwin' ? describe : describe.skip)('Modal Dialog', function () {
	let dialog: ModalDialog;

	before(async () => {
		this.timeout(30000);
		await new Workbench().executeCommand('Create: New File...');
		await (await InputBox.create()).selectQuickPick('Text File');
		await new Promise((res) => setTimeout(res, 1000));
		const editor = new TextEditor();
		await editor.typeTextAt(1, 1, 'text');
		await new Promise((res) => setTimeout(res, 1000));
		await new EditorView().closeEditor(await editor.getTitle());
		await new Promise((res) => setTimeout(res, 1000));
		dialog = new ModalDialog();
		await dialog.getDriver().wait(until.elementsLocated(By.className('monaco-dialog-box')), 5000);
	});

	after(async function () {
		await new Promise((res) => setTimeout(res, 1000));
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
		await dialog.getDriver().wait(until.stalenessOf(dialog), 2000);
	});
});
