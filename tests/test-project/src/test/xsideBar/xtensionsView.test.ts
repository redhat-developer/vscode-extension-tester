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

import { ActivityBar, ExtensionsViewSection, EditorView, ExtensionsViewItem, VSBrowser, ViewControl } from 'vscode-extension-tester';
import { expect } from 'chai';
import pjson from '../../../package.json';
import { satisfies } from 'compare-versions';
import { waitFor } from '../testUtils';

describe('ExtensionsView', () => {
	let section: ExtensionsViewSection;
	let item: ExtensionsViewItem;

	let sectionTitle = 'Enabled';
	if (VSBrowser.browserName === 'vscode' && satisfies(VSBrowser.instance.version, '>=1.48.0')) {
		sectionTitle = 'Installed';
	}

	before(async () => {
		section = await getSection();
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
		await waitFor(
			async () => {
				item = (await section.findItem(`@installed ${pjson.displayName}`)) as ExtensionsViewItem;
				return item !== undefined;
			},
			{ timeout: 25000, message: 'Extension item not found' },
		);
		expect(item).not.undefined;
	});

	describe('ExtensionsViewItem', async () => {
		before(async function () {
			this.timeout(45000);
			// Use existing section from parent before, just need to find the item
			// Clear any previous search first
			try {
				await section.clearSearch();
			} catch {
				// Ignore if clear fails
			}
			await waitFor(
				async () => {
					item = (await section.findItem(`@installed ${pjson.displayName}`)) as ExtensionsViewItem;
					return item !== undefined;
				},
				{ timeout: 35000, message: 'Extension item not found in before hook' },
			);
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

		(process.platform === 'darwin' && satisfies(VSBrowser.instance.version, '<1.101.0') ? it.skip : it)('manage works', async () => {
			const menu = await item.manage();
			expect(menu).not.undefined;
			await menu.close();
		});
	});

	async function getSection(): Promise<ExtensionsViewSection> {
		const view = await ((await new ActivityBar().getViewControl('Extensions')) as ViewControl).openView();
		await waitFor(async () => (await view.getContent().getSections()).length > 0, { timeout: 10000, message: 'Extensions sections did not appear' });
		return (await view.getContent().getSection(sectionTitle)) as ExtensionsViewSection;
	}
});
