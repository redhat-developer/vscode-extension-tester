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
import { BottomBarPanel, By, CustomTreeSection, EditorView, SideBarView, WebviewView, Workbench } from 'vscode-extension-tester';
import { waitFor } from '../testUtils';

describe('WebviewViews', function () {
	let webviewView: InstanceType<typeof WebviewView>;

	function runTests(title: string, li: string[]) {
		it(`Shopping List Title ${title}`, async () => {
			const element = await webviewView.findWebElement(By.css('h1'));
			expect(await element.getText()).has.string(title);
		});

		it(`Shopping List Equals ${li.join(', ')} `, async () => {
			const elts = await webviewView.findWebElements(By.xpath('//div/ul/li'));
			expect(elts.length).equals(li.length);
			// Collect list items sequentially to preserve DOM order — using
			// Promise.all with an array push would resolve in non-deterministic
			// order on slow CI runners.
			const listContent: string[] = [];
			for (const elt of elts) {
				listContent.push(await elt.getText());
			}
			expect(listContent).to.eql(li);
		});
	}

	async function closeBottomPanel() {
		await waitFor(
			async () => {
				try {
					await new BottomBarPanel().toggle(false);
					return true;
				} catch (err) {
					// Dismiss "Linux subsystem for Windows available" notification to avoid the error: "ElementClickInterceptedError"
					const notifications = await new Workbench().getNotifications();
					if (process.platform === 'win32' && notifications.length > 0) {
						await notifications[0].dismiss();
					}
					return false;
				}
			},
			{ timeout: 10_000, pollInterval: 1000, message: 'Failed to close bottom panel' },
		);
	}

	async function closeSidePanel() {
		const section = (await new SideBarView().getContent().getSection('My Side Panel View')) as CustomTreeSection;
		await section.collapse();
	}

	after(async function () {
		await new EditorView().closeAllEditors();
	});

	describe('BottomBar WebviewViews', function () {
		before(async function () {
			this.timeout(15_000);
			await new Workbench().executeCommand('My Panel: Focus on My Panel View View');
			// Wait for the panel to be visible before constructing the WebviewView
			// and switching frames. forStable() on a newly-opened panel confirms
			// the element has settled in the DOM after the command resolves.
			await waitFor(
				async () => {
					const panel = new BottomBarPanel();
					return await panel.isDisplayed();
				},
				{ timeout: 5_000, message: 'BottomBarPanel did not become visible' },
			);
			const panel = new BottomBarPanel();
			webviewView = new WebviewView(panel);
			await webviewView.switchToFrame(10_000);
		});
		after(async () => {
			await webviewView.switchBack();
			await closeBottomPanel();
		});

		runTests('Shopping List', ['Apple', 'Banana']);
	});

	describe('Sidebar WebviewViews', function () {
		before(async function () {
			this.timeout(15_000);
			await new Workbench().executeCommand('Explorer: Focus on My Side Panel View View');
			// Wait for the sidebar to be visible before constructing the WebviewView.
			await waitFor(
				async () => {
					const sidebar = new SideBarView();
					return await sidebar.isDisplayed();
				},
				{ timeout: 5_000, message: 'SideBarView did not become visible' },
			);
			const sidebar = new SideBarView();
			webviewView = new WebviewView(sidebar);
			await webviewView.switchToFrame(10_000);
		});
		after(async () => {
			await webviewView.switchBack();
			await closeSidePanel();
		});

		runTests('Shopping Side List', ['Side Apple', 'Side Banana']);
	});

	describe('Sidebar And BottomBar WebviewViews', function () {
		before(async function () {
			this.timeout(20_000);
			await new Workbench().executeCommand('My Panel: Focus on My Panel View View');
			// Confirm the panel is visible before opening the sidebar so both
			// views are fully rendered before the nested suites switch frames.
			await waitFor(async () => new BottomBarPanel().isDisplayed(), { timeout: 5_000, message: 'BottomBarPanel did not become visible' });
			await new Workbench().executeCommand('Explorer: Focus on My Side Panel View View');
			await waitFor(async () => new SideBarView().isDisplayed(), { timeout: 5_000, message: 'SideBarView did not become visible' });
		});
		after(async () => {
			await closeSidePanel();
			await closeBottomPanel();
		});

		describe('Shopping List Sidebar', function () {
			before(async function () {
				this.timeout(15_000);
				const sidebar = new SideBarView();
				webviewView = new WebviewView(sidebar);
				await webviewView.switchToFrame(10_000);
			});

			after(async () => {
				await webviewView.switchBack();
			});
			runTests('Shopping Side List', ['Side Apple', 'Side Banana']);
		});
		describe('Shopping List Bottombar', function () {
			before(async function () {
				this.timeout(15_000);
				const panel = new BottomBarPanel();
				webviewView = new WebviewView(panel);
				await webviewView.switchToFrame(10_000);
			});

			after(async () => {
				await webviewView.switchBack();
			});
			runTests('Shopping List', ['Apple', 'Banana']);
		});
	});
});
