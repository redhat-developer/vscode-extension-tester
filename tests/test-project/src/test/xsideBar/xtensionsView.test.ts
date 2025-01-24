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

import { ActivityBar, ExtensionsViewSection, EditorView, ExtensionsViewItem, VSBrowser, beforeEach, ViewControl } from 'vscode-extension-tester';
import { expect } from 'chai';
import pjson from '../../../package.json';
import { compareVersions } from 'compare-versions';

describe('ExtensionsView', () => {
	let section: ExtensionsViewSection;
	let item: ExtensionsViewItem;

	let sectionTitle = 'Enabled';
	if (VSBrowser.browserName === 'vscode' && compareVersions(VSBrowser.instance.version, '1.48.0') >= 0) {
		sectionTitle = 'Installed';
	}

	before(async () => {
		const view = await ((await new ActivityBar().getViewControl('Extensions')) as ViewControl).openView();
		await view.getDriver().wait(async function () {
			return (await view.getContent().getSections()).length > 0;
		});
		section = (await view.getContent().getSection(sectionTitle)) as ExtensionsViewSection;
	});

	after(async function () {
		await ((await new ActivityBar().getViewControl('Extensions')) as ViewControl).closeView();
		await new EditorView().closeAllEditors();
	});

	it('getTitle works', async () => {
		const title = await section.getTitle();
		expect(title).equals(sectionTitle);
	});

	it('getVisibleItems works', async () => {
		const items = await section.getVisibleItems();
		expect(items).not.undefined;
	});

	it('findItem works', async function () {
		this.timeout(30000);
		await section.getDriver().wait(async function () {
			item = (await section.findItem(`@installed ${pjson.displayName}`)) as ExtensionsViewItem;
			return item !== undefined;
		});
		expect(item).not.undefined;
	});

	describe('ExtensionsViewItem', async () => {
		beforeEach(async function () {
			await section.getDriver().wait(async function () {
				item = (await section.findItem(`@installed ${pjson.displayName}`)) as ExtensionsViewItem;
				return item !== undefined;
			});
		});

		after(async () => {
			await section.clearSearch();
		});

		it('getTitle works', async () => {
			const title = await item.getTitle();
			expect(title).equals(pjson.displayName);
		});

		it('getVersion works', async () => {
			const version = await item.getVersion();
			expect(version).equals(pjson.version);
		});

		it('getAuthor works', async () => {
			const author = await item.getAuthor();
			expect(author).equals(pjson.publisher);
		});

		it('getDescription works', async () => {
			const desc = await item.getDescription();
			expect(desc).equals(pjson.description);
		});

		it('isInstalled works', async () => {
			const installed = await item.isInstalled();
			expect(installed).is.true;
		});

		(process.platform === 'darwin' ? it.skip : it)('manage works', async () => {
			const menu = await item.manage();
			expect(menu).not.undefined;
			await menu.close();
		});
	});
});
