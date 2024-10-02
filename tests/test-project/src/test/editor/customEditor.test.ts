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
import path from 'path';
import { CustomEditor, EditorView, VSBrowser, By } from 'vscode-extension-tester';

describe('CustomEditor', () => {
	let editor: CustomEditor;

	const CUSTOM_TITLE: string = 'example.cscratch';

	before(async () => {
		await VSBrowser.instance.openResources({ path: path.resolve(__dirname, '..', '..', '..', 'resources', CUSTOM_TITLE) });
		editor = new CustomEditor();
	});

	after(async () => {
		await new EditorView().closeAllEditors();
	});

	it('webview is available', async () => {
		const webview = editor.getWebView();
		await webview.switchToFrame();
		try {
			const btn = await webview.findWebElement(By.className('add-button'));
			await new Promise((res) => setTimeout(res, 500));
			await btn.click();
			await new Promise((res) => setTimeout(res, 1000));
			const notes = await webview.findWebElements(By.className('note'));
			const note = notes[notes.length - 1];
			await webview.getDriver().actions().move({ origin: note }).perform();
			await note.findElement(By.className('delete-button')).click();
		} catch (err) {
			if (err instanceof Error) {
				expect.fail(err.message);
			}
		} finally {
			if (webview) {
				await webview.switchBack();
			}
		}
	});

	it('isDirty works', async () => {
		await new EditorView().openEditor(CUSTOM_TITLE);
		await new Promise((res) => setTimeout(res, 500));
		expect(await editor.isDirty()).is.true;
	});

	it('save works', async () => {
		await new EditorView().openEditor(CUSTOM_TITLE);
		await new Promise((res) => setTimeout(res, 500));
		await editor.save();
		await new Promise((res) => setTimeout(res, 500));
		expect(await editor.isDirty()).is.false;
	});

	it('save as works', async () => {
		await new EditorView().openEditor(CUSTOM_TITLE);
		await new Promise((res) => setTimeout(res, 500));
		try {
			const input = await editor.saveAs();
			expect(await input.isDisplayed()).is.true;
			if (input && (await input.isDisplayed())) {
				await input.cancel();
			}
		} catch (err) {
			if (err instanceof Error) {
				expect.fail(err.message);
			}
		}
	});
});
