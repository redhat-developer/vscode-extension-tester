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
 * This test suite verifies the functionality of the ExTester Tree Provider.
 * It performs UI-based tests to ensure that the test files are properly parsed
 * and displayed in the VS Code test explorer tree view.
 */

import * as assert from 'assert';
import {
	TreeItem,
	ViewSection,
	VSBrowser,
	WebDriver
} from 'vscode-extension-tester';
import {
	ACTIONS_FOLDER,
	EXAMPLE_PROJECT,
	getSection,
	OUTPUT_FOLDER_SETTINGS_ID,
	ROOT_FOLDER_SETTINGS_ID,
	SCREENSHOTS_VIEW_NO_SCREENSHOTS,
	TEMP_FOLDER_SETTINGS_ID,
	TEST_FILE_GLOB_SETTINGS_DEFAULT,
	TEST_FILE_GLOB_SETTINGS_ID,
	updateSettings,
	waitUntilTerminalHasText
} from './utils/testUtils';
import path from 'path';
import fs from 'fs';

/** Pattern for matching test files in the actions directory */
const TEST_FILE_GLOB = '**/actions/*.test.ts';

/**
 * Test suite for the screenshots view functionality.
 * @description This suite verifies the correct behavior of the screenshots view in the VS Code test explorer,
 * including the display of screenshots and handling of cases when no screenshots are available.
 */
describe.skip('Screenshots view test suite', function () {
	this.timeout(300000);

	let driver: WebDriver;

	/**
	 * Initializes the test environment before running the suite.
	 * @description Sets up the necessary configuration including:
	 * - Opening the example project
	 * - Configuring test file glob pattern
	 * - Setting root and output folders
	 * - Creating temporary test folder
	 */
	before(async function () {
		this.timeout(30000);

		driver = VSBrowser.instance.driver;

		const browser = VSBrowser.instance;
		await browser.openResources(EXAMPLE_PROJECT);

		await updateSettings(TEST_FILE_GLOB_SETTINGS_ID, TEST_FILE_GLOB);
		await updateSettings(ROOT_FOLDER_SETTINGS_ID, 'src');
		await updateSettings(OUTPUT_FOLDER_SETTINGS_ID, 'out');
		await updateSettings(TEMP_FOLDER_SETTINGS_ID, 'temporary-folder-test-04');
	});

	/**
	 * Cleans up the test environment after the suite completes.
	 * @description Resets all settings to their default values and removes the temporary test folder.
	 */
	after(async function () {
		this.timeout(30000);

		await updateSettings(TEST_FILE_GLOB_SETTINGS_ID, TEST_FILE_GLOB_SETTINGS_DEFAULT);
		await updateSettings(ROOT_FOLDER_SETTINGS_ID, ' ');
		await updateSettings(OUTPUT_FOLDER_SETTINGS_ID, 'out');
		await updateSettings(TEMP_FOLDER_SETTINGS_ID, ' ');

		// remove temporary test folder
		const tempFolder = path.join(EXAMPLE_PROJECT, 'temporary-folder-test-04');
		if (fs.existsSync(tempFolder)) {
			fs.rmSync(tempFolder, { recursive: true, force: true });
		}
	});

	/**
	 * Verifies the correct display when no screenshots are present in the test view.
	 * @description Tests that the screenshots view properly displays a message when no screenshots are available.
	 */
	it('no screenshot avialble', async function () {
		let section: ViewSection;
		section = await getSection(1);
		const visibleItems = await section.getVisibleItems();
		assert.equal(visibleItems.length, 1);

		const item = visibleItems[0];
		assert.equal(await item.getText(), SCREENSHOTS_VIEW_NO_SCREENSHOTS);
	});

	/**
	 * Tests the process of creating and displaying screenshots in the test view.
	 * @description Verifies that screenshots can be created and are properly displayed in the screenshots view.
	 * @steps
	 * 1. Opens the actions folder in the test view
	 * 2. Locates and interacts with createScreenshot.test.ts
	 * 3. Clicks the first action button
	 * 4. Waits for test completion
	 * 5. Verifies the created screenshots
	 */
	it('screenshot created', async function () {
		let section: ViewSection;
		section = await getSection(0);

		await section.openItem(ACTIONS_FOLDER);
		const item = (await section.findItem('createScreenshot.test.ts')) as TreeItem;

		const btns = await item.getActionButtons();
		await btns.at(0)?.click();

		await waitUntilTerminalHasText(driver, '1 passing', 120_000, 1_000);

		let screensectrion: ViewSection;
		screensectrion = await getSection(1);

		const visibleItems = await screensectrion.getVisibleItems();
		assert.equal(visibleItems.length, 2);

		assert.equal(await visibleItems[0].getText(), 'screenshot1.png');
		assert.equal(await visibleItems[1].getText(), 'screenshot2.png');
	});
});
