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
import { BottomBarPanel, By, CustomTreeSection, EditorView, SideBarView, VSBrowser, WebviewView, Workbench } from 'vscode-extension-tester';

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
			const listContent: string[] = [];
			await Promise.all(
				elts.map(async (elt) => {
					listContent.push(await elt.getText());
				}),
			);
			expect(listContent).to.eql(li);
		});
	}

	async function closeBottomPanel() {
		await VSBrowser.instance.driver.wait(
			async function () {
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
			10000,
			undefined,
			1000,
		);
	}

	async function closeSidePanel() {
		const section = (await new SideBarView().getContent().getSection('My Side Panel View')) as CustomTreeSection;
		await section.collapse();
	}

	after(async function () {
		await new EditorView().closeAllEditors();
	});

	describe('BottomBar WebviewViews', async () => {
		before(async () => {
			this.timeout(10000);
			await new Workbench().executeCommand('My Panel: Focus on My Panel View View');
			await new Promise((res) => setTimeout(res, 2000));
			webviewView = new WebviewView(new BottomBarPanel());
			await webviewView.switchToFrame(5000);
		});
		after(async () => {
			await webviewView.switchBack();
			await closeBottomPanel();
		});

		runTests('Shopping List', ['Apple', 'Banana']);
	});

	describe('Sidebar WebviewViews', function () {
		before(async () => {
			this.timeout(10000);
			await new Workbench().executeCommand('Explorer: Focus on My Side Panel View View');
			await new Promise((res) => setTimeout(res, 2000));
			webviewView = new WebviewView(new SideBarView());
			await webviewView.switchToFrame(5000);
		});
		after(async () => {
			await webviewView.switchBack();
			await closeSidePanel();
		});

		runTests('Shopping Side List', ['Side Apple', 'Side Banana']);
	});

	describe('Sidebar And BottomBar WebviewViews', function () {
		before(async () => {
			this.timeout(10000);
			await new Workbench().executeCommand('My Panel: Focus on My Panel View View');
			await new Workbench().executeCommand('Explorer: Focus on My Side Panel View View');
			await new Promise((res) => setTimeout(res, 2000));
		});
		after(async () => {
			await closeSidePanel();
			await closeBottomPanel();
		});

		describe('Shopping List Sidebar', async () => {
			before(async () => {
				webviewView = new WebviewView(new SideBarView());
				await webviewView.switchToFrame(5000);
			});

			after(async () => {
				await webviewView.switchBack();
			});
			runTests('Shopping Side List', ['Side Apple', 'Side Banana']);
		});
		describe('Shopping List Bottombar', async () => {
			before(async () => {
				webviewView = new WebviewView(new BottomBarPanel());
				await webviewView.switchToFrame(5000);
			});

			after(async () => {
				await webviewView.switchBack();
			});
			runTests('Shopping List', ['Apple', 'Banana']);
		});
	});
});
