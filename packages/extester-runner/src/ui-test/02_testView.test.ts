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
 * This test suite verifies the UI components and functionality of the ExTester Runner extension's test views.
 * It performs UI-based tests to ensure that the Tests, Screenshots, and Logs views are properly displayed,
 * contain the correct elements, and show appropriate messages when no data is present.
 */

import { ViewSection } from 'vscode-extension-tester';
import {
	SCREENSHOTS_VIEW,
	SCREENSHOTS_VIEW_NO_SCREENSHOTS,
	TESTS_VIEW_NO_TESTS,
	TESTS_VIEW,
	LOGS_VIEW,
	LOGS_VIEW_NO_LOGS,
	COLLAPSE_ALL_BTN,
	TEST_VIEW_REFRESH_BTN,
	SCREENSHOTS_VIEW_REFRESH_BTN,
	LOGS_VIEW_REFRESH_BTN,
	TEMP_FOLDER_SETTINGS_ID,
	getSection,
	updateSettings,
} from './utils/testUtils';
import { assert } from 'chai';

/**
 * Test suite for empty views
 * Verifies the correct display and functionality of all views when no data is present
 */
describe('Empty View Tests', function () {
	/**
	 * Setup function that runs before all tests
	 * Configures a temporary folder for test data and ensures a clean editor state
	 */
	before(async function () {
		this.timeout(10000);
		const testValue = `temp-${Math.random().toString(36).substring(2, 10)}`; // random folder for empty logs and screenshots
		await updateSettings(TEMP_FOLDER_SETTINGS_ID, testValue);
	});

	/**
	 * Cleanup function that runs after all tests
	 * Restores the original temp folder setting and ensures a clean editor state
	 */
	after(async function () {
		this.timeout(10000);
		await updateSettings(TEMP_FOLDER_SETTINGS_ID, ' ');
	});

	/**
	 * Test suite for the Tests view
	 * Verifies the correct display and functionality of the Tests view panel
	 */
	describe('UI Tests view', function () {
		let section: ViewSection;

		/**
		 * Setup function that runs before each test in this suite
		 * Retrieves the Tests view section
		 */
		before(async function () {
			section = await getSection(0);
		});

		/**
		 * Verifies that the Tests view has the correct title
		 */
		it('has right title', async function () {
			const title = await section.getTitle();
			assert.equal(title, TESTS_VIEW);
		});

		/**
		 * Verifies that the Tests view shows the correct message when no tests are present
		 */
		it('shows no tests message', async function () {
			const visibleItems = await section.getVisibleItems();
			assert.equal(visibleItems.length, 1);

			const item = visibleItems[0];
			assert.equal(await item.getText(), TESTS_VIEW_NO_TESTS);
		});

		/**
		 * Verifies that the Tests view has the correct action buttons with proper labels and states
		 */
		it('action buttons are correct', async function () {
			const actions = await section.getActions();
			assert.equal(actions.length, 2);

			const [refreshBtn, collapseBtn] = actions;

			assert.equal(await refreshBtn.getLabel(), TEST_VIEW_REFRESH_BTN);
			assert.equal(await refreshBtn.isEnabled(), true);

			assert.equal(await collapseBtn.getLabel(), COLLAPSE_ALL_BTN);
			assert.equal(await collapseBtn.isEnabled(), false);
		});
	});

	/**
	 * Test suite for the Screenshots view
	 * Verifies the correct display and functionality of the Screenshots view panel
	 */
	describe('Screenshots view', function () {
		let section: ViewSection;

		/**
		 * Setup function that runs before each test in this suite
		 * Retrieves the Screenshots view section
		 */
		before(async function () {
			section = await getSection(1);
		});

		/**
		 * Verifies that the Screenshots view has the correct title
		 */
		it('has right title', async function () {
			const title = await section.getTitle();
			assert.equal(title, SCREENSHOTS_VIEW);
		});

		/**
		 * Verifies that the Screenshots view shows the correct message when no screenshots are present
		 */
		it('shows no tests message', async function () {
			const visibleItems = await section.getVisibleItems();
			assert.equal(visibleItems.length, 1);

			const item = visibleItems[0];
			assert.equal(await item.getText(), SCREENSHOTS_VIEW_NO_SCREENSHOTS);
		});

		/**
		 * Verifies that the Screenshots view has the correct action buttons with proper labels and states
		 */
		it('action buttons are correct', async function () {
			const actions = await section.getActions();
			assert.equal(actions.length, 1);

			const [refreshBtn] = actions;

			assert.equal(await refreshBtn.getLabel(), SCREENSHOTS_VIEW_REFRESH_BTN);
			assert.equal(await refreshBtn.isEnabled(), true);
		});
	});

	/**
	 * Test suite for the Logs view
	 * Verifies the correct display and functionality of the Logs view panel
	 */
	describe('Logs view', function () {
		let section: ViewSection;

		/**
		 * Setup function that runs before each test in this suite
		 * Retrieves the Logs view section
		 */
		before(async function () {
			section = await getSection(2);
		});

		/**
		 * Verifies that the Logs view has the correct title
		 */
		it('has right title', async function () {
			const title = await section.getTitle();
			assert.equal(title, LOGS_VIEW);
		});

		/**
		 * Verifies that the Logs view shows the correct message when no logs are present
		 */
		it('shows no tests message', async function () {
			const visibleItems = await section.getVisibleItems();
			assert.equal(visibleItems.length, 1);

			const item = visibleItems[0];
			assert.equal(await item.getText(), LOGS_VIEW_NO_LOGS);
		});

		/**
		 * Verifies that the Logs view has the correct action buttons with proper labels and states
		 */
		it('action buttons are correct', async function () {
			const actions = await section.getActions();
			assert.equal(actions.length, 2);

			const [refreshBtn, collapseBtn] = actions;

			assert.equal(await refreshBtn.getLabel(), LOGS_VIEW_REFRESH_BTN);
			assert.equal(await refreshBtn.isEnabled(), true);

			assert.equal(await collapseBtn.getLabel(), COLLAPSE_ALL_BTN);
			assert.equal(await collapseBtn.isEnabled(), false);
		});
	});
});
