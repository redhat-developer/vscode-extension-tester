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

/**
 * This test suite verifies the basic installation and configuration of the ExTester Runner extension.
 * It performs UI-based tests to ensure that the extension is properly installed, activated,
 * and displays the correct metadata in the VS Code Extensions view.
 */

import { assert } from 'chai';
import { ActivityBar, EditorView, ExtensionsViewItem, ExtensionsViewSection, SideBarView, ViewControl, VSBrowser, WebDriver } from 'vscode-extension-tester';
import { waitUntilExtensionIsActivated } from './utils/testUtils';
import * as pjson from '../../package.json';

/**
 * Main test suite for ExTester Runner extension verification
 *
 * This suite contains tests that verify the basic functionality and installation
 * status of the ExTester Runner extension. It uses the VS Code Extension Tester
 * framework to interact with the VS Code UI and verify extension properties.
 */
describe('ExTester Runner', function () {
	this.timeout(30_000);

	let driver: WebDriver;

	/**
	 * Setup function that runs before all tests
	 * Initializes the WebDriver and waits for the extension to be activated
	 */
	before(async function () {
		driver = VSBrowser.instance.driver;
		await waitUntilExtensionIsActivated(driver, `${pjson.displayName}`);
	});

	/**
	 * Test suite for verifying extension installation and metadata
	 *
	 * This suite focuses on verifying that the extension is properly installed
	 * and displays the correct information in the VS Code Extensions view.
	 */
	describe('Is extension properly installed', function () {
		let viewControl: ViewControl;
		let extensionsView: SideBarView;
		let item: ExtensionsViewItem;

		/**
		 * Setup function that runs before each test in this suite
		 * Opens the Extensions view and waits for it to load
		 */
		before(async function () {
			viewControl = (await new ActivityBar().getViewControl('Extensions')) as ViewControl;
			extensionsView = await viewControl.openView();
			await driver.wait(async function () {
				return (await extensionsView.getContent().getSections()).length > 0;
			});
		});

		/**
		 * Cleanup function that runs after each test in this suite
		 * Closes the Extensions view and any open editors
		 */
		after(async function () {
			await viewControl.closeView();
			await new EditorView().closeAllEditors();
		});

		/**
		 * Verifies that the extension can be found in the Installed extensions section
		 */
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

		/**
		 * Verifies that the extension is properly installed
		 */
		it('Extension is installed', async function () {
			const installed = await item.isInstalled();
			assert.isTrue(installed);
		});

		/**
		 * Verifies that the extension's display name matches the package.json configuration
		 */
		it('Verify display name', async function () {
			const title = await item.getTitle();
			assert.equal(title, `${pjson.displayName}`);
		});

		/**
		 * Verifies that the extension's version matches the package.json configuration
		 */
		it('Verify version', async function () {
			const version = await item.getVersion();
			assert.equal(version, `${pjson.version}`);
		});
	});
});
