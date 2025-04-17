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

import { assert } from 'chai';
import { ActivityBar, EditorView, ExtensionsViewItem, ExtensionsViewSection, SideBarView, ViewControl, VSBrowser, WebDriver } from 'vscode-extension-tester';
import { waitUntilExtensionIsActivated } from './utils/testUtils';
import * as pjson from '../../package.json';

describe('ExTester Runner', function () {
	this.timeout(30_000);

	let driver: WebDriver;

	before(async function () {
		driver = VSBrowser.instance.driver;
		await waitUntilExtensionIsActivated(driver, `${pjson.displayName}`);
	});

	describe('Is extersnion properly installed', function () {
		let viewControl: ViewControl;
		let extensionsView: SideBarView;
		let item: ExtensionsViewItem;

		before(async function () {
			viewControl = (await new ActivityBar().getViewControl('Extensions')) as ViewControl;
			extensionsView = await viewControl.openView();
			await driver.wait(async function () {
				return (await extensionsView.getContent().getSections()).length > 0;
			});
		});

		after(async function () {
			await viewControl.closeView();
			await new EditorView().closeAllEditors();
		});

		it('Find extension', async function () {
			await driver.wait(async function () {
				const it = await ((await extensionsView.getContent().getSection('Installed')) as ExtensionsViewSection).findItem(
					`@installed ${pjson.displayName}`,
				);
				if (it !== undefined) {
					item = it;
				}
				return item !== undefined;
			});
			assert.isNotNull(item);
		});

		it('Extension is installed', async function () {
			const installed = await item.isInstalled();
			assert.isTrue(installed);
		});

		it('Verify display name', async function () {
			const title = await item.getTitle();
			assert.equal(title, `${pjson.displayName}`);
		});

		// skipping because the description picked is the one of the pushed extension on Marketplace and not the one of the installed locally
		it.skip('Verify description', async function () {
			const desc = await item.getDescription();
			assert.equal(desc, `${pjson.description}`);
		});

		it('Verify version', async function () {
			const version = await item.getVersion();
			assert.equal(version, `${pjson.version}`);
		});
	});
});
