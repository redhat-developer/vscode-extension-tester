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
import {
	ActivityBar,
	EditorView,
	ExtensionEditorView,
	ExtensionEditorDetailsSection,
	ExtensionsViewItem,
	ExtensionsViewSection,
	SideBarView,
	ViewControl,
	VSBrowser,
	WebDriver,
	Workbench,
	BottomBarPanel,
	after,
	before,
} from 'vscode-extension-tester';
import * as pjson from '../../../package.json';
import * as path from 'path';
import { satisfies } from 'compare-versions';

describe('Extension Editor', function () {
	let driver: WebDriver;
	let viewControl: ViewControl;
	let extensionsView: SideBarView;
	let item: ExtensionsViewItem;

	let extensionEditor: ExtensionEditorView;
	let extensionEditorDetails: ExtensionEditorDetailsSection;

	before(async function (this: Mocha.Context) {
		this.timeout(60000);

		driver = VSBrowser.instance.driver;
		await driver.switchTo().defaultContent();
		await VSBrowser.instance.openResources(path.resolve(__dirname, '..', '..', '..', 'resources', 'test-folder'));
		await VSBrowser.instance.waitForWorkbench();
		// Page objects constructed in the instant before the reload's DOM teardown
		// die on first use — retry the whole acquisition until the view opens.
		await driver.wait(
			async () => {
				try {
					viewControl = (await new ActivityBar().getViewControl('Extensions')) as ViewControl;
					extensionsView = await viewControl.openView();
					return true;
				} catch {
					return false;
				}
			},
			30000,
			'Could not open the Extensions view',
		);
		await driver.wait(async function () {
			return (await extensionsView.getContent().getSections()).length > 0;
		}, 15000);

		const view = await viewControl.openView();

		await driver.wait(async function () {
			return (await view.getContent().getSections()).length > 0;
		}, 15000);
		await driver.wait(async function () {
			try {
				const currentView = await viewControl.openView();
				const currentSection = (await currentView.getContent().getSection('Installed')) as ExtensionsViewSection;
				item = (await currentSection.findItem(`@installed ${pjson.displayName}`)) as ExtensionsViewItem;
				return item !== undefined;
			} catch (e: any) {
				if (e.name === 'StaleElementReferenceError') {
					return false;
				}
				throw e;
			}
		}, 30000);

		await driver.wait(
			async () => {
				// Every step in this poll can hit a stale element while the extensions
				// list or editor area re-renders — treat any failure as "not yet" and
				// retry on the next tick rather than failing the whole hook.
				try {
					try {
						await item.click();
					} catch {
						// The extensions list re-renders asynchronously (marketplace queries,
						// filter refreshes) and stales the item reference — re-locate it
						// before the next attempt instead of clicking a dead element.
						const currentView = await viewControl.openView();
						const currentSection = (await currentView.getContent().getSection('Installed')) as ExtensionsViewSection;
						item = (await currentSection.findItem(`@installed ${pjson.displayName}`)) as ExtensionsViewItem;
					}
					const titles = await new EditorView().getOpenEditorTitles();
					return titles.some((title) => title.includes('Extension:'));
				} catch {
					return false;
				}
			},
			30000,
			'Extension editor did not open after click',
		);
	});

	// ensure clean workbench
	before(async function (this: Mocha.Context) {
		this.timeout(15000);
		const panel = new BottomBarPanel();
		if (await panel.isDisplayed()) {
			await panel.toggle(false);
		}
		try {
			await (await new Workbench().openNotificationsCenter()).clearAllNotifications();
		} catch {
			// Notifications center may already be empty or not accessible
		}
	});

	after(async function (this: Mocha.Context) {
		this.timeout(30000);
		// viewControl stays undefined when the before() hook failed early —
		// cleanup must not mask the original failure with a TypeError.
		if (viewControl) {
			await viewControl.closeView();
		}
		await new EditorView().closeAllEditors();
		// Re-open the original workspace. The first before() hook changed
		// the workspace to test-folder via openResources — subsequent test
		// files (settingsEditor, textEditor) need the workspace to be the
		// test-project root so their CLI-based file opens can succeed.
		await VSBrowser.instance.openResources(path.resolve(__dirname, '..', '..', '..'));
		await VSBrowser.instance.waitForWorkbench();
	});

	describe('ExtensionEditorView', function () {
		before(async function (this: Mocha.Context) {
			extensionEditor = new ExtensionEditorView();
		});

		it('getName', async function () {
			expect(await extensionEditor.getName()).equal('Test Project');
		});

		(satisfies(VSBrowser.instance.version, '<1.96.0') ? it : it.skip)('getVersion', async function () {
			expect(await extensionEditor.getVersion()).equal('v0.1.0');
		});

		it('getPublisher', async function () {
			expect(await extensionEditor.getPublisher()).equal('ExTester');
		});

		it('getDescription', async function () {
			expect(await extensionEditor.getDescription()).equal('Extension dedicated to self-testing the ExTester package');
		});

		// Not working on test project.
		it.skip('getCount', async function () {});

		it('getTabs', async function () {
			const tabs = await extensionEditor.getTabs();
			expect(tabs).to.have.lengthOf(2);
			expect(tabs).to.contain('FEATURES');
		});

		it('switchToTab', async function () {
			expect(await extensionEditor.switchToTab('Features')).to.be.true;
		});

		it('getActiveTab', async function () {
			expect(await extensionEditor.getActiveTab()).equal('FEATURES');
		});
	});

	describe('ExtensionEditorDetailsSections', function () {
		before(async function (this: Mocha.Context) {
			await extensionEditor.switchToTab('Details');
			extensionEditorDetails = new ExtensionEditorDetailsSection();
		});

		it('getCategories', async function () {
			const categories = await extensionEditorDetails.getCategories();
			expect(categories).to.have.lengthOf(2);
			expect(categories).to.contain('Testing');
		});

		// Not working on test project.
		it.skip('getResources', async function () {});

		it('getMoreInfo', async function () {
			const moreInfo = await extensionEditorDetails.getMoreInfo();
			expect(moreInfo).not.to.be.undefined;
			expect(Object.keys(moreInfo)).to.contain.oneOf(['Last updated', 'Last Updated']);
			expect(Object.values(moreInfo)).to.contain('extester.extester-test');
		});

		it('getMoreInfoItem', async function () {
			expect(await extensionEditorDetails.getMoreInfoItem('Identifier')).equal('extester.extester-test');
		});

		(satisfies(VSBrowser.instance.version, '>=1.96.0') ? it : it.skip)('getVersion', async function () {
			expect(await extensionEditorDetails.getVersion()).equal('0.1.0');
		});

		it('getReadme', async function () {
			const readmeFrame = await extensionEditorDetails.getReadme();
			expect(readmeFrame).to.not.be.null;
		});

		it('getReadmeContent', async function () {
			const readme = await extensionEditorDetails.getReadmeContent();
			expect(readme).contains(`ExTester - Test Project\nThis is a simple extension for a VS Code dedicated to self-testing the ExTester framework.`);
		});
	});
});
