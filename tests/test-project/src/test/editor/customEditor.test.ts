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
import { waitFor, getWaitHelper } from '../testUtils';

describe('CustomEditor', () => {
	let editor: CustomEditor;

	const CUSTOM_TITLE: string = 'example.cscratch';

	before(async function () {
		this.timeout(100000);
		// Ensure the driver is at the top-level window context before doing anything,
		// in case a previous test suite left it inside a webview frame.
		await VSBrowser.instance.driver.switchTo().defaultContent();
		await VSBrowser.instance.openResources(path.resolve(__dirname, '..', '..', '..', 'resources', CUSTOM_TITLE));
		const ew = new EditorView();
		await waitFor(
			async () => {
				const titles = await ew.getOpenEditorTitles();
				return titles.includes(CUSTOM_TITLE);
			},
			{ timeout: 20000, message: `Unable to find opened custom editor with title '${CUSTOM_TITLE}'` },
		);
		editor = new CustomEditor();

		// Wait for the webview iframe to be fully ready before any test uses it.
		// switchToFrame() polls for both the outer and inner active-frame iframes
		// under a single shared deadline, so a single call with a generous timeout
		// is both correct and sufficient — no retry loop needed in the test.
		// Generous timeout: the slowest CI runners have shown webview creation
		// taking well over 30s while the rest of the suite runs 4-5x slower too.
		const webview = editor.getWebView();
		await webview.switchToFrame(60000);
		await webview.switchBack();
	});

	after(async function () {
		this.timeout(15000);
		await VSBrowser.instance.driver.switchTo().defaultContent();
		await new EditorView().closeAllEditors();
	});

	it('webview is available', async function () {
		this.timeout(20000);
		const webview = editor.getWebView();
		await webview.switchToFrame(10000);
		try {
			const btn = await webview.findWebElement(By.className('add-button'));
			const wait = getWaitHelper();
			await wait.forCondition(async () => (await btn.isDisplayed()) && (await btn.isEnabled()), { timeout: 5000 });
			await btn.click();
			await wait.forCondition(
				async () => {
					const notes = await webview.findWebElements(By.className('note'));
					return notes.length > 0;
				},
				{ timeout: 5000, message: 'Notes did not appear after clicking add-button' },
			);
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

	it('isDirty works', async function () {
		this.timeout(15000);
		const ew = new EditorView();
		await ew.openEditor(CUSTOM_TITLE);
		// Wait for the tab to actually become active before checking dirty state
		await waitFor(async () => (await (await ew.getActiveTab())?.getTitle()) === CUSTOM_TITLE, {
			timeout: 5000,
			message: `Editor '${CUSTOM_TITLE}' did not become active`,
		});
		await waitFor(async () => await editor.isDirty(), { timeout: 8000, message: 'Editor did not become dirty' });
		expect(await editor.isDirty()).is.true;
	});

	it('save works', async function () {
		this.timeout(15000);
		const ew = new EditorView();
		await ew.openEditor(CUSTOM_TITLE);
		// Wait for the tab to actually become active before checking dirty state
		await waitFor(async () => (await (await ew.getActiveTab())?.getTitle()) === CUSTOM_TITLE, {
			timeout: 5000,
			message: `Editor '${CUSTOM_TITLE}' did not become active`,
		});
		await waitFor(async () => await editor.isDirty(), { timeout: 8000, message: 'Editor did not become dirty before save' });
		await editor.save();
		await waitFor(async () => !(await editor.isDirty()), { timeout: 5000, message: 'Editor did not save successfully' });
		expect(await editor.isDirty()).is.false;
	});

	it('save as works', async function () {
		this.timeout(15000);
		const ew = new EditorView();
		await ew.openEditor(CUSTOM_TITLE);
		await waitFor(async () => (await (await ew.getActiveTab())?.getTitle()) === CUSTOM_TITLE, {
			timeout: 5000,
			message: 'Custom editor did not become active before saveAs',
		});
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
