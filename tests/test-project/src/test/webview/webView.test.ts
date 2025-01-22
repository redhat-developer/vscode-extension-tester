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

import { Workbench, EditorView, WebView, By, EditorGroup } from 'vscode-extension-tester';
import { expect } from 'chai';

describe('WebViews', function () {
	describe('Single WebView', function () {
		let view: WebView;

		before(async function () {
			this.timeout(8000);
			await new Workbench().executeCommand('Webview Test Column 1');
			await new Promise((res) => {
				setTimeout(res, 500);
			});
			view = new WebView();
			await view.switchToFrame();
		});

		after(async function () {
			await view.switchBack();
			await new EditorView().closeAllEditors();
		});

		it('findWebElement works', async function () {
			const element = await view.findWebElement(By.css('h1'));
			expect(await element.getText()).has.string('This is a web view');
		});

		it('findWebElements works', async function () {
			const elements = await view.findWebElements(By.css('h1'));
			expect(elements.length).equals(1);
		});
	});

	describe('Several Group WebViews', function () {
		let view: WebView;
		let tabs: string[];
		let editorGroups: EditorGroup[];

		before(async function () {
			await new EditorView().closeAllEditors();
		});

		before(async function () {
			this.timeout(30000);

			const workbench = new Workbench();

			await workbench.executeCommand('Webview Test Column 1');
			await new Promise((res) => {
				setTimeout(res, 500);
			});

			await workbench.executeCommand('Webview Test Column 2');
			await new Promise((res) => {
				setTimeout(res, 500);
			});

			await workbench.executeCommand('Webview Test Column 3');
			await new Promise((res) => {
				setTimeout(res, 500);
			});

			const editorView = new EditorView();
			const groups = await editorView.getEditorGroups();
			const group1 = await editorView.getEditorGroup(0);
			const group2 = await editorView.getEditorGroup(1);
			const group3 = await editorView.getEditorGroup(2);
			expect(groups.length).equals(3);

			const tabsGroup1 = await group1.getOpenTabs();
			const tabsGroup2 = await group2.getOpenTabs();
			const tabsGroup3 = await group3.getOpenTabs();

			expect(tabsGroup1.length).equals(1);
			expect(tabsGroup2.length).equals(1);
			expect(tabsGroup3.length).equals(1);

			editorGroups = [group1, group2, group3];
			tabs = [await tabsGroup1[0].getTitle(), await tabsGroup2[0].getTitle(), await tabsGroup3[0].getTitle()];
		});

		describe('First WebView', function () {
			void switchToFrame(0);
			void runTests(0);
			void clean();
		});

		describe('Second WebView', async function () {
			void switchToFrame(1);
			void runTests(1);
			void clean();
		});

		describe('Third WebView', async function () {
			void switchToFrame(2);
			void runTests(2);
			void clean();
		});

		async function switchToFrame(index: number) {
			before(async function () {
				view = new WebView(editorGroups[index]);
				await view.switchToFrame();
			});
		}

		async function runTests(index: number) {
			it('findWebElement works', async function () {
				const element = await view.findWebElement(By.css('h1'));
				expect(await element.getText()).has.string(`This is a web view with title: ${tabs[index]}`);
			});

			it('findWebElements works', async function () {
				const elements = await view.findWebElements(By.css('h1'));
				expect(elements.length).equals(1);
			});
		}

		async function clean() {
			after(async function () {
				await view.switchBack();
			});
		}
	});

	describe('Several WebViews', function () {
		let view: WebView;
		let tabs: string[];

		before(async function () {
			await new EditorView().closeAllEditors();
		});

		before(async function () {
			this.timeout(30000);

			const workbench = new Workbench();

			await workbench.executeCommand('Webview Test Column 1');
			await new Promise((res) => {
				setTimeout(res, 500);
			});

			await workbench.executeCommand('Webview Test Column 1');
			await new Promise((res) => {
				setTimeout(res, 500);
			});

			await workbench.executeCommand('Webview Test Column 1');
			await new Promise((res) => {
				setTimeout(res, 500);
			});

			tabs = await new EditorView().getOpenEditorTitles();
		});

		describe('First WebView', function () {
			before(async function () {
				await new EditorView().openEditor(tabs[0]);
			});

			void switchToFrame();
			void runTests(0);
			void clean();
		});

		describe('Second WebView', async function () {
			before(async function () {
				await new EditorView().openEditor(tabs[1]);
			});

			void switchToFrame();
			void runTests(1);
			void clean();
		});

		describe('Third WebView', async function () {
			before(async function () {
				await new EditorView().openEditor(tabs[2]);
			});

			void switchToFrame();
			void runTests(2);
			void clean();
		});

		async function switchToFrame() {
			before(async function () {
				view = new WebView();
				await view.switchToFrame();
			});
		}

		async function runTests(index: number) {
			it('findWebElement works', async function () {
				const element = await view.findWebElement(By.css('h1'));
				expect(await element.getText()).has.string(`This is a web view with title: ${tabs[index]}`);
			});

			it('findWebElements works', async function () {
				const elements = await view.findWebElements(By.css('h1'));
				expect(elements.length).equals(1);
			});
		}

		async function clean() {
			after(async function () {
				await view.switchBack();
			});
		}
	});
});
