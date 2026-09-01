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
import * as path from 'path';
import { EditorView, VSBrowser } from 'vscode-extension-tester';
import { waitFor } from '../testUtils';

const FILE_A = 'test-file-a.txt';
const FILE_B = 'test-file-b.txt';

/**
 * Synthetic stand-in for a VS Code hover widget: a DOM overlay covering the
 * click target. VS Code hovers appear while the WebDriver pointer rests on the
 * last click point and are torn down only when the pointer moves away — the
 * "dismissing" variant reproduces exactly that contract (removes itself on the
 * first real mousemove), while the "persistent" variant models overlays no
 * pointer movement can dismiss (modals, toasts).
 */
const INJECT_OVERLAY = `
	const [target, dismissOnMouseMove, overlayClass] = arguments;
	const rect = target.getBoundingClientRect();
	const overlay = document.createElement('div');
	overlay.className = (overlayClass || 'monaco-hover') + ' extester-probe-overlay';
	overlay.style.cssText = 'position:fixed;z-index:100000;pointer-events:auto;'
		+ 'left:' + (rect.left - 10) + 'px;top:' + (rect.top - 10) + 'px;'
		+ 'width:' + (rect.width + 20) + 'px;height:' + (rect.height + 20) + 'px;';
	document.body.appendChild(overlay);
	if (dismissOnMouseMove) {
		const onMove = () => {
			overlay.remove();
			document.removeEventListener('mousemove', onMove, true);
		};
		document.addEventListener('mousemove', onMove, true);
	}
`;

const REMOVE_OVERLAYS = `document.querySelectorAll('.extester-probe-overlay').forEach((el) => el.remove());`;

describe('Click interception recovery', function () {
	this.timeout(60000);
	let editorView: EditorView;

	before(async function () {
		this.timeout(120000);
		await VSBrowser.instance.openResources(
			path.resolve(__dirname, '..', '..', '..', 'resources', FILE_A),
			path.resolve(__dirname, '..', '..', '..', 'resources', FILE_B),
		);
		editorView = new EditorView();
		await waitFor(
			async () => {
				const titles = await editorView.getOpenEditorTitles();
				return titles.includes(FILE_A) && titles.includes(FILE_B);
			},
			{ timeout: 15000, message: `Resources ${FILE_A} or ${FILE_B} did not open` },
		);
	});

	afterEach(async function () {
		await VSBrowser.instance.driver.executeScript(REMOVE_OVERLAYS);
	});

	after(async function () {
		await new EditorView().closeAllEditors();
	});

	it('clicks through a hover-like overlay that dismisses on pointer movement', async function () {
		// make FILE_A the active tab with a plain, unobstructed click
		await (await editorView.getTabByTitle(FILE_A)).click();
		const tabB = await editorView.getTabByTitle(FILE_B);
		await VSBrowser.instance.driver.executeScript(INJECT_OVERLAY, tabB, true);

		await tabB.click();

		// Tabs switch on mousedown, which a JS-executor click cannot produce: a
		// passing assertion proves a REAL click landed after the overlay was
		// dismissed by actual pointer movement.
		const active = await editorView.getActiveTab();
		expect(await active?.getTitle()).equals(FILE_B);
	});

	it('does not throw when the intercepting overlay never dismisses', async function () {
		const tabA = await editorView.getTabByTitle(FILE_A);
		await VSBrowser.instance.driver.executeScript(INJECT_OVERLAY, tabA, false);

		// the persistent overlay swallows every native attempt — the click must
		// still resolve (JS-executor fallback) instead of throwing
		await tabA.click();
	});

	it('rethrows when a modal blocker intercepts instead of JS-clicking through it', async function () {
		const tabA = await editorView.getTabByTitle(FILE_A);
		await VSBrowser.instance.driver.executeScript(INJECT_OVERLAY, tabA, false, 'monaco-dialog-modal-block');

		// a modal-blocked UI must fail fast with the original error — a
		// JS-executor click through a modal would trigger actions the real UI
		// forbids and leave the workbench in an inconsistent state
		let thrown: Error | undefined;
		try {
			await tabA.click();
		} catch (e) {
			thrown = e as Error;
		}
		expect(thrown?.name).equals('ElementClickInterceptedError');
	});
});
