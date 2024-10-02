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
} from 'vscode-extension-tester';
import * as pjson from '../../../package.json';
import * as path from 'path';

describe('Extension Editor', function () {
	this.timeout(99999999);
	let driver: WebDriver;
	let viewControl: ViewControl;
	let extensionsView: SideBarView;
	let item: ExtensionsViewItem;

	let section: ExtensionsViewSection;

	let extensionEditor: ExtensionEditorView;
	let extensionEditorDetails: ExtensionEditorDetailsSection;

	before(async function () {
		driver = VSBrowser.instance.driver;
		await VSBrowser.instance.openResources({ path: path.resolve(__dirname, '..', '..', '..', 'resources', 'test-folder') });
		viewControl = (await new ActivityBar().getViewControl('Extensions')) as ViewControl;
		extensionsView = await viewControl.openView();
		await driver.wait(async function () {
			return (await extensionsView.getContent().getSections()).length > 0;
		});

		section = (await extensionsView.getContent().getSection('Installed')) as ExtensionsViewSection;
		await driver.wait(async function () {
			item = (await section.findItem(`@installed ${pjson.displayName}`)) as ExtensionsViewItem;
			return item !== undefined;
		});

		await item.click();
	});

	after(async function () {
		await viewControl.closeView();
		await new EditorView().closeAllEditors();
	});

	describe('ExtensionEditorView', function () {
		before(async function () {
			extensionEditor = new ExtensionEditorView();
		});

		it('getName', async function () {
			expect(await extensionEditor.getName()).equal('Test Project');
		});

		it('getVersion', async function () {
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
		before(async function () {
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
			expect(Object.keys(moreInfo)[0]).equal('Last updated');
			expect(Object.values(moreInfo)[1]).equal('extester.extester-test');
		});

		it('getMoreInfoItem', async function () {
			expect(await extensionEditorDetails.getMoreInfoItem('Identifier')).equal('extester.extester-test');
		});

		// Blocked by https://github.com/redhat-developer/vscode-extension-tester/issues/1492
		it.skip('getReadme', async function () {});
	});
});
