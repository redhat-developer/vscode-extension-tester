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

import { VSBrowser, ActivityBar, DefaultTreeSection } from 'vscode-extension-tester';
import {
	EXAMPLE_PROJECT,
	TEST_FILE_GLOB_SETTINGS_ID,
	EXTESTER_RUNNER,
	SIMPLE_FILE,
	SIMPLE_FILE_WITH_MODIFIERS,
	SIMPLE_FILE_WITH_VARIABLES,
	MULTIPLE_ROOT_DESCRIBES,
	COMPLEX_FILE,
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

	/**
	 * Setup function that runs before all tests
	 * Configures the test file glob setting and opens the example project
	 */
	before(async function () {
		this.timeout(30000);

		const browser = VSBrowser.instance;
		await browser.openResources(EXAMPLE_PROJECT);

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

		const content = await runnerView.getContent();
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
		const item = await tree.findItem(SIMPLE_FILE);
		await item?.expand();

		// Verify describe block
		const describes = await item?.getChildren();
		assert.ok(describes?.length === 1, `${SIMPLE_FILE} should have exactly one describe`);

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
	 * Verifies parsing of a test file with modifiers
	 * Tests that the describe.only and it.skip modifiers are correctly displayed in the tree view
	 */
	it('simpleFileWithModifier.test.ts', async function () {
		const EXPECTED_DESCRIBE = 'Simple suite with only modifier [only]';
		const EXPECTED_TEST = 'Simple test with skip modifier [skip]';

		// Setup test view
		const runnerView = await (await new ActivityBar().getViewControl(EXTESTER_RUNNER))?.openView();
		assert.ok(runnerView, 'Runner view not found');

		const content = await runnerView.getContent();
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

		const content = await runnerView.getContent();
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

		const content = await runnerView.getContent();
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
		const firstDesribeIts = await firstDescribe.getChildren();
		assert.ok(firstDesribeIts?.length === 1, 'First describe should have exactly one it');

		const firstDesribeFirstIt = firstDesribeIts[0];
		const firstDesribeFirstItLabel = await firstDesribeFirstIt.getLabel();
		assert.strictEqual(firstDesribeFirstItLabel.trim(), EXPECTED_TEST_1);

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

	/**
	 * Verifies parsing of a complex test file with nested describe blocks and various modifiers
	 * Tests that complex test structures are correctly displayed in the tree view
	 *
	 * @note This test is currently skipped as the content is too large to fit on the test screen
	 */
	it.skip('complexFile.test.ts', async function () {
		// Setup test view
		const runnerView = await (await new ActivityBar().getViewControl(EXTESTER_RUNNER))?.openView();
		assert.ok(runnerView, 'Runner view not found');

		const content = await runnerView.getContent();
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
		const item = await tree.findItem(COMPLEX_FILE);
		await item?.expand();

		// Verify describe block
		const describes = await item?.getChildren();
		assert.ok(describes?.length === 1, `${COMPLEX_FILE} should have exactly one root describe.`);

		// root suite
		const rootSuite = describes[0];
		const rootSuiteLabel = await rootSuite.getLabel();
		assert.strictEqual(rootSuiteLabel.trim(), 'Root suite modifier: no parentModifier: no');

		// root suite children
		const rootSuiteChildren = await rootSuite.getChildren();
		assert.ok(rootSuiteChildren?.length === 4, 'Root describe should have exactly 4 children (3 it, 1 describe)');

		// root test 1
		const rootSuiteIt1 = rootSuiteChildren[0];
		const rootSuiteIt1Label = await rootSuiteIt1.getLabel();
		assert.strictEqual(rootSuiteIt1Label.trim(), 'Root test 1 modifier: no parentModifier: no');

		// root test 2
		const rootSuiteIt2 = rootSuiteChildren[1];
		const rootSuiteIt2Label = await rootSuiteIt2.getLabel();
		assert.strictEqual(rootSuiteIt2Label.trim(), 'Root test 2 modifier: skip parentModifier: no [skip]');

		// root test 3
		const rootSuiteIt3 = rootSuiteChildren[2];
		const rootSuiteIt3Label = await rootSuiteIt3.getLabel();
		assert.strictEqual(rootSuiteIt3Label.trim(), 'Root test 3 modifier: only parentModifier: no [only]');

		// child suite
		const rootSuiteChildSuite = rootSuiteChildren[3];
		const rootSuiteChildSuiteLabel = await rootSuiteChildSuite.getLabel();
		assert.strictEqual(rootSuiteChildSuiteLabel.trim(), 'Child suite modifier: only parentModifier: no [only]');

		// child suite children
		await rootSuiteChildSuite.expand();
		const childSuiteChildren = await rootSuiteChildSuite.getChildren();
		assert.ok(childSuiteChildren?.length === 6, 'Child suite should have exactly 6 children (4 it, 2 describe)');

		// child suite test 1
		const childSuitesTest1 = childSuiteChildren[0];
		const childSuitesTest1Label = await childSuitesTest1.getLabel();
		assert.strictEqual(childSuitesTest1Label.trim(), 'Child test 1 modifier: no parentModifier: only');

		// child suite test 2
		const childSuitesTest2 = childSuiteChildren[1];
		const childSuitesTest2Label = await childSuitesTest2.getLabel();
		assert.strictEqual(childSuitesTest2Label.trim(), 'Child test 2 modifier: skip parentModifier: only [skip]');

		// child suite test 3
		const childSuitesTest3 = childSuiteChildren[2];
		const childSuitesTest3Label = await childSuitesTest3.getLabel();
		assert.strictEqual(childSuitesTest3Label.trim(), 'Child test 3 modifier: no parentModifier: only');

		// child suite test 4
		const childSuitesTest4 = childSuiteChildren[3];
		const childSuitesTest4Label = await childSuitesTest4.getLabel();
		assert.strictEqual(childSuitesTest4Label.trim(), 'Child test 4 modifier: only parentModifier: only [only]');

		// child suite describe 1 (grandchild1)
		const childSuitesGrandchildSuite1 = childSuiteChildren[4];
		const childSuitesGrandchildSuite1Label = await childSuitesGrandchildSuite1.getLabel();
		assert.strictEqual(childSuitesGrandchildSuite1Label.trim(), 'Grandchild suite 1 modifier: no parentModifier: only');

		// child suite describe 2 (grandchild2)
		const childSuitesGrandchildSuite2 = childSuiteChildren[5];
		const childSuitesGrandchildSuite2Label = await childSuitesGrandchildSuite2.getLabel();
		assert.strictEqual(childSuitesGrandchildSuite2Label.trim(), 'Grandchild suite 2 modifier: skip parentModifier: only [skip]');

		// grandchild  1 suite children
		await childSuitesGrandchildSuite1.expand();
		const grandchild1SuiteChildren = await childSuitesGrandchildSuite1.getChildren();
		assert.ok(grandchild1SuiteChildren?.length === 5, 'Child suite should have exactly 5 it.');

		// grandchild 1 suite test 1
		const grandChild1SuiteTest1 = grandchild1SuiteChildren[0];
		const grandChild1SuiteTest1Label = await grandChild1SuiteTest1.getLabel();
		assert.strictEqual(grandChild1SuiteTest1Label.trim(), 'Grandchild suite 1 test 1 modifier: no parentModifier: only');

		// grandchild 1 suite test 2
		const grandChild1SuiteTest2 = grandchild1SuiteChildren[1];
		const grandChild1SuiteTest2Label = await grandChild1SuiteTest2.getLabel();
		assert.strictEqual(grandChild1SuiteTest2Label.trim(), 'Grandchild suite 1 test 2 modifier: skip parentModifier: only [skip]');

		// grandchild 1 suite test 3
		const grandChild1SuiteTest3 = grandchild1SuiteChildren[2];
		const grandChild1SuiteTest3Label = await grandChild1SuiteTest3.getLabel();
		assert.strictEqual(grandChild1SuiteTest3Label.trim(), 'Grandchild suite 1 test 3 modifier: no parentModifier: only');

		// grandchild 1 suite test 4
		const grandChild1SuiteTest4 = grandchild1SuiteChildren[3];
		const grandChild1SuiteTest4Label = await grandChild1SuiteTest4.getLabel();
		assert.strictEqual(grandChild1SuiteTest4Label.trim(), 'Grandchild suite 1 test 4 modifier: only parentModifier: only [only]');

		// grandchild 1 suite test 5
		const grandChild1SuiteTest5 = grandchild1SuiteChildren[4];
		const grandChild1SuiteTest5Label = await grandChild1SuiteTest5.getLabel();
		assert.strictEqual(grandChild1SuiteTest5Label.trim(), 'Grandchild suite 1 test 5 modifier: no parentModifier: only');

		// grandchild  2 suite children
		await childSuitesGrandchildSuite2.expand();
		const grandchild2SuiteChildren = await childSuitesGrandchildSuite2.getChildren();
		assert.ok(grandchild2SuiteChildren?.length === 6, 'Child suite should have exactly 6 it.');

		// grandchild 2 suite test 1
		const grandChild2SuiteTest1 = grandchild2SuiteChildren[0];
		const grandChild2SuiteTest1Label = await grandChild2SuiteTest1.getLabel();
		assert.strictEqual(grandChild2SuiteTest1Label.trim(), 'Grandchild suite 2 test 1 modifier: no parentModifier: skip');

		// grandchild 2 suite test 2
		const grandChild2SuiteTest2 = grandchild2SuiteChildren[1];
		const grandChild2SuiteTest2Label = await grandChild2SuiteTest2.getLabel();
		assert.strictEqual(grandChild2SuiteTest2Label.trim(), 'Grandchild suite 2 test 2 modifier: skip parentModifier: skip [skip]');

		// grandchild 2 suite test 3
		const grandChild2SuiteTest3 = grandchild2SuiteChildren[2];
		const grandChild2SuiteTest3Label = await grandChild2SuiteTest3.getLabel();
		assert.strictEqual(grandChild2SuiteTest3Label.trim(), 'Grandchild suite 2 test 3 modifier: no parentModifier: skip');

		// grandchild 2 suite test 4
		const grandChild2SuiteTest4 = grandchild2SuiteChildren[3];
		const grandChild2SuiteTest4Label = await grandChild2SuiteTest4.getLabel();
		assert.strictEqual(grandChild2SuiteTest4Label.trim(), 'Grandchild suite 2 test 4 modifier: only parentModifier: skip [only]');

		// grandchild 2 suite test 5
		const grandChild2SuiteTest5 = grandchild2SuiteChildren[4];
		const grandChild2SuiteTest5Label = await grandChild2SuiteTest5.getLabel();
		assert.strictEqual(grandChild2SuiteTest5Label.trim(), 'Grandchild suite 2 test 5 modifier: no parentModifier: skip');

		// grandchild 2 suite test 6
		const grandChild2SuiteTest6 = grandchild2SuiteChildren[5];
		const grandChild2SuiteTest6Label = await grandChild2SuiteTest6.getLabel();
		assert.strictEqual(grandChild2SuiteTest6Label.trim(), 'Grandchild suite 2 test 6 modifier: no parentModifier: skip');
	});
});
