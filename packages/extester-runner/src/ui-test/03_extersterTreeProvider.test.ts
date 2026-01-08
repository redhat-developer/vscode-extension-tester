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

import { VSBrowser, ActivityBar, DefaultTreeSection, WaitHelper, createWaitHelper } from 'vscode-extension-tester';
import {
	EXAMPLE_PROJECT,
	TEST_FILE_GLOB_SETTINGS_ID,
	EXTESTER_RUNNER,
	SIMPLE_FILE,
	SIMPLE_FILE_WITH_MODIFIERS,
	SIMPLE_FILE_WITH_VARIABLES,
	MULTIPLE_ROOT_DESCRIBES,
	PARSER_FOLDER,
	updateSettings,
	TEST_FILE_GLOB_SETTINGS_DEFAULT,
} from './utils/testUtils';
import * as assert from 'assert';
import { expect } from 'chai';

// Constants for test values
const TEST_FILE_GLOB = '**/parser/*.test.ts';

/**
 * Main test suite for ExTester Tree Provider verification
 *
 * This suite contains tests that verify the proper parsing and display of test files
 * in the VS Code test explorer tree view. It tests various test file structures including
 * simple tests, tests with modifiers, tests with variables, and complex nested test structures.
 */
describe('Parser test suite', function () {
	this.timeout(60000);

	let browser: VSBrowser;
	let waitHelper: WaitHelper;

	/**
	 * Setup function that runs before all tests
	 * Configures the test file glob setting and opens the example project
	 */
	before(async function () {
		this.timeout(30000);

		browser = VSBrowser.instance;
		waitHelper = createWaitHelper(browser.driver, 5000);

		await browser.openResources(EXAMPLE_PROJECT, async () => {
			await browser.driver.sleep(3_000);
		});

		await updateSettings(TEST_FILE_GLOB_SETTINGS_ID, TEST_FILE_GLOB);
	});

	/**
	 * Cleanup function that runs after all tests
	 * Restores the original test file glob setting
	 */
	after(async function () {
		this.timeout(15000);
		await updateSettings(TEST_FILE_GLOB_SETTINGS_ID, TEST_FILE_GLOB_SETTINGS_DEFAULT);
	});

	/**
	 * Verifies parsing of a simple test file with no modifiers
	 * Tests that the describe and it blocks are correctly displayed in the tree view
	 */
	it('simpleFile.test.ts', async function () {
		const EXPECTED_DESCRIBE = 'Simple suite without modifier';
		const EXPECTED_TEST = 'Simple test without modifier';

		// Setup test view
		const runnerView = await (await new ActivityBar().getViewControl(EXTESTER_RUNNER))?.openView();
		assert.ok(runnerView, 'Runner view not found');

		const content = runnerView.getContent();
		assert.ok(content, 'Content not found');

		const sections = await content.getSections();
		assert.ok(sections?.length > 0, 'No sections found');

		const tree = sections[0] as DefaultTreeSection;

		// Verify parser folder exists
		await waitHelper.forCondition(
			async () => {
				const items = await tree.getVisibleItems();
				const item = await items[0]?.getLabel();
				if (!item) {
					return false;
				}
				return item.includes(PARSER_FOLDER);
			},
			{ timeout: 5000, message: 'Tree items not found' },
		);

		const items = await tree.getVisibleItems();
		const labels = await Promise.all(items.map((item) => item.getLabel()));
		expect(labels).contains(PARSER_FOLDER);

		// Navigate to test file
		await tree.openItem(PARSER_FOLDER);
		const item = await tree.findItem(SIMPLE_FILE);
		await item?.expand();

		// Verify describe block
		const describes = await item?.getChildren();
		assert.ok(describes?.length === 1, `${SIMPLE_FILE} should have exactly one describe`);

		const firstDescribe = describes[0];
		const describeLabel = await firstDescribe.getLabel();
		assert.strictEqual(describeLabel.trim(), EXPECTED_DESCRIBE);

		await waitHelper.forCondition(
			async () => {
				const its = await firstDescribe.getChildren();
				if (!its) {
					return false;
				}
				return its.length > 0;
			},
			{ timeout: 5000, message: 'Its not found' },
		);

		// Verify test block
		const its = await firstDescribe.getChildren();
		assert.ok(its?.length === 1, 'First describe should have exactly one it');

		const firstIt = its[0];
		const firstItLabel = await firstIt.getLabel();
		assert.strictEqual(firstItLabel.trim(), EXPECTED_TEST);
	});

	/**
	 * Verifies parsing of a test file with modifiers
	 * Tests that the describe.only and it.skip modifiers are correctly displayed in the tree view
	 */
	it('simpleFileWithModifier.test.ts', async function () {
		const EXPECTED_DESCRIBE = 'Simple suite with only modifier [only]';
		const EXPECTED_TEST = 'Simple test with skip modifier [skip]';

		// Setup test view
		const runnerView = await (await new ActivityBar().getViewControl(EXTESTER_RUNNER))?.openView();
		assert.ok(runnerView, 'Runner view not found');

		const content = runnerView.getContent();
		assert.ok(content, 'Content not found');

		const sections = await content.getSections();
		assert.ok(sections?.length > 0, 'No sections found');

		const tree = sections[0] as DefaultTreeSection;

		// Verify parser folder exists
		const items = await tree.getVisibleItems();
		const labels = await Promise.all(items.map((item) => item.getLabel()));
		expect(labels).contains(PARSER_FOLDER);

		// Navigate to test file
		await tree.openItem(PARSER_FOLDER);
		const item = await tree.findItem(SIMPLE_FILE_WITH_MODIFIERS);
		await item?.expand();

		// Verify describe block
		const describes = await item?.getChildren();
		assert.ok(describes?.length === 1, `${SIMPLE_FILE_WITH_MODIFIERS} should have exactly one describe`);

		const firstDescribe = describes[0];
		const describeLabel = await firstDescribe.getLabel();
		assert.strictEqual(describeLabel.trim(), EXPECTED_DESCRIBE);

		// Verify test block
		const its = await firstDescribe.getChildren();
		assert.ok(its?.length === 1, 'First describe should have exactly one it');

		const firstIt = its[0];
		const firstItLabel = await firstIt.getLabel();
		assert.strictEqual(firstItLabel.trim(), EXPECTED_TEST);
	});

	/**
	 * Verifies parsing of a test file with variables
	 * Tests that variables in describe and it blocks are correctly displayed in the tree view
	 */
	it('simpleFileWithVariable.test.ts', async function () {
		const EXPECTED_DESCRIBE = 'Simple suite with ${variable}';
		const EXPECTED_TEST = 'Simple test with ${variable}';

		// Setup test view
		const runnerView = await (await new ActivityBar().getViewControl(EXTESTER_RUNNER))?.openView();
		assert.ok(runnerView, 'Runner view not found');

		const content = runnerView.getContent();
		assert.ok(content, 'Content not found');

		const sections = await content.getSections();
		assert.ok(sections?.length > 0, 'No sections found');

		const tree = sections[0] as DefaultTreeSection;

		// Verify parser folder exists
		const items = await tree.getVisibleItems();
		const labels = await Promise.all(items.map((item) => item.getLabel()));
		expect(labels).contains(PARSER_FOLDER);

		// Navigate to test file
		await tree.openItem(PARSER_FOLDER);
		const item = await tree.findItem(SIMPLE_FILE_WITH_VARIABLES);
		await item?.expand();

		// Verify describe block
		const describes = await item?.getChildren();
		assert.ok(describes?.length === 1, `${SIMPLE_FILE_WITH_VARIABLES} should have exactly one describe`);

		const firstDescribe = describes[0];
		const describeLabel = await firstDescribe.getLabel();
		assert.strictEqual(describeLabel.trim(), EXPECTED_DESCRIBE);

		// Verify test block
		const its = await firstDescribe.getChildren();
		assert.ok(its?.length === 1, 'First describe should have exactly one it');

		const firstIt = its[0];
		const firstItLabel = await firstIt.getLabel();
		assert.strictEqual(firstItLabel.trim(), EXPECTED_TEST);
	});

	/**
	 * Verifies parsing of a test file with multiple root describe blocks
	 * Tests that multiple root-level describe blocks are correctly displayed in the tree view
	 */
	it('multipleRootDescribe.test.ts', async function () {
		const EXPECTED_DESCRIBE_1 = 'Root suite 1';
		const EXPECTED_TEST_1 = 'Root suite 1 test 1';
		const EXPECTED_DESCRIBE_2 = 'Root suite 2';
		const EXPECTED_TEST_2 = 'Root suite 2 test 1';

		// Setup test view
		const runnerView = await (await new ActivityBar().getViewControl(EXTESTER_RUNNER))?.openView();
		assert.ok(runnerView, 'Runner view not found');

		const content = runnerView.getContent();
		assert.ok(content, 'Content not found');

		const sections = await content.getSections();
		assert.ok(sections?.length > 0, 'No sections found');

		const tree = sections[0] as DefaultTreeSection;

		// Verify parser folder exists
		const items = await tree.getVisibleItems();
		const labels = await Promise.all(items.map((item) => item.getLabel()));
		expect(labels).contains(PARSER_FOLDER);

		// Navigate to test file
		await tree.openItem(PARSER_FOLDER);
		const item = await tree.findItem(MULTIPLE_ROOT_DESCRIBES);
		await item?.expand();

		// Verify describe blocks
		const describes = await item?.getChildren();
		assert.ok(describes?.length === 2, `${MULTIPLE_ROOT_DESCRIBES} should have exactly two describes`);

		// first describe
		const firstDescribe = describes[0];
		const firstDescribeLabel = await firstDescribe.getLabel();
		assert.strictEqual(firstDescribeLabel.trim(), EXPECTED_DESCRIBE_1);

		// first describe first test
		const firstDescribeIts = await firstDescribe.getChildren();
		assert.ok(firstDescribeIts?.length === 1, 'First describe should have exactly one it');

		const firstDescribeFirstIt = firstDescribeIts[0];
		const firstDescribeFirstItLabel = await firstDescribeFirstIt.getLabel();
		assert.strictEqual(firstDescribeFirstItLabel.trim(), EXPECTED_TEST_1);

		// second describe
		const secondDescribe = describes[1];
		const secondDescribeLabel = await secondDescribe.getLabel();
		assert.strictEqual(secondDescribeLabel.trim(), EXPECTED_DESCRIBE_2);

		// second describe first test
		const secondDescribeIts = await secondDescribe.getChildren();
		assert.ok(secondDescribeIts?.length === 1, 'Second describe should have exactly one it');

		const secondDescribeFirstIt = secondDescribeIts[0];
		const secondDescribeFirstItLabel = await secondDescribeFirstIt.getLabel();
		assert.strictEqual(secondDescribeFirstItLabel.trim(), EXPECTED_TEST_2);
	});
});
