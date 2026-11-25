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
 * and displayed in the Test Explorer of VS Code's Testing view.
 */

import { VSBrowser, By, CustomTreeItem, GenericCustomTreeSection, error, TreeItem, TreeSection, ViewContent, WebElement } from 'vscode-extension-tester';
import {
	ACTIONS_FOLDER,
	EXAMPLE_PROJECT,
	TEST_FILE_GLOB_SETTINGS_ID,
	TEST_EXPLORER_SECTION,
	getTestingSection,
	SIMPLE_FILE,
	SIMPLE_FILE_WITH_MODIFIERS,
	SIMPLE_FILE_WITH_VARIABLES,
	MULTIPLE_ROOT_DESCRIBES,
	PARSER_FOLDER,
	updateSettings,
	TEST_FILE_GLOB_SETTINGS_DEFAULT,
} from './utils/testUtils';
import * as assert from 'assert';

// Constants for test values
const TEST_FILE_GLOB = '**/parser/*.test.ts';
const TREE_TIMEOUT = 20000;

/**
 * A row of the Test Explorer in the Testing view.
 * The Testing view renders its own rows: the label is a plain `.label` element, followed by
 * a `.test-label-description` span, instead of the highlighted label of other trees.
 */
class TestExplorerItem extends CustomTreeItem {
	constructor(element: WebElement, viewPart: TreeSection) {
		super(element, viewPart);
	}

	async getLabel(): Promise<string> {
		const label = await this.findElement(By.css('.testing-stdtree-container > .label'));
		return await this.getDriver().executeScript<string>(
			`return Array.from(arguments[0].childNodes)
				.filter((node) => !(node.classList && node.classList.contains('test-label-description')))
				.map((node) => node.textContent)
				.join('')
				.trim();`,
			label,
		);
	}

	/**
	 * Reads the description shown next to the label, for example a `.only` or `.skip` modifier.
	 * Uses the text content instead of the visible text: a narrow side bar can clip the description, and
	 * WebDriver then returns an empty string for the visible text.
	 */
	async getDescription(): Promise<string> {
		const description = await this.findElement(By.className('test-label-description'));
		return ((await description.getAttribute('textContent')) ?? '').trim();
	}

	async getChildren(): Promise<TreeItem[]> {
		const rows = await this.getChildItems(TestExplorerItem.locators.DefaultTreeSection.itemRow);
		return await Promise.all(rows.map(async (row) => new TestExplorerItem(row, this.enclosingItem as TreeSection).wait()));
	}
}

/**
 * The Test Explorer section of the Testing view, with {@link TestExplorerItem} rows.
 */
class TestExplorerSection extends GenericCustomTreeSection<TestExplorerItem> {
	constructor(panel: WebElement, viewContent: ViewContent) {
		super(panel, viewContent, TestExplorerItem);
	}
}

/**
 * Waits until a step succeeds and returns its result.
 * The Testing view rebuilds its rows whenever the tests are discovered again, so a step can meet a
 * stale, missing or still hidden element. Such a step is retried until it returns a value.
 *
 * @param {string} what - What the step looks for, used in the error message.
 * @param {() => Promise<T | undefined>} step - The step; it returns undefined while the tree is not ready.
 * @param {number} timeout - Maximum time to wait in milliseconds.
 * @returns {Promise<T>} The value the step returned.
 */
async function waitFor<T>(what: string, step: () => Promise<T | undefined>, timeout = TREE_TIMEOUT): Promise<T> {
	let result: T | undefined;
	let lastError: unknown;
	try {
		await VSBrowser.instance.driver.wait(
			async () => {
				try {
					result = await step();
					return result !== undefined;
				} catch (e) {
					lastError = e;
					return false;
				}
			},
			timeout,
			undefined,
			500,
		);
	} catch (e) {
		throw new Error(`${what} not found after ${timeout} ms: ${lastError ?? e}`);
	}
	return result!;
}

/**
 * Returns the Test Explorer of the Testing view, where the ExTester controller lists the tests.
 *
 * @returns {Promise<TestExplorerSection>} The test tree.
 */
async function getTestExplorer(): Promise<TestExplorerSection> {
	const tree = await getTestingSection(TEST_EXPLORER_SECTION, TestExplorerSection);
	await tree.expand();
	return tree;
}

/**
 * Finds a shown tree item by its label.
 * An empty view hides its tree behind the welcome content until the tests are discovered, and
 * WebDriver cannot interact with the hidden tree in the meantime, so no item is found then.
 *
 * @param {TestExplorerSection} tree - The tree section.
 * @param {string} label - The label of the item.
 * @returns {Promise<TreeItem | undefined>} The item, or undefined while it is not shown.
 */
async function findShownItem(tree: TestExplorerSection, label: string): Promise<TreeItem | undefined> {
	try {
		return await tree.findItem(label);
	} catch (e) {
		if (e instanceof error.ElementNotInteractableError) {
			return undefined;
		}
		throw e;
	}
}

/**
 * Expands the parser folder and the given test file, and returns the expanded file item.
 *
 * @param {TestExplorerSection} tree - The tree section.
 * @param {string} fileName - The test file name.
 * @returns {Promise<TreeItem>} The expanded file item.
 */
async function openTestFile(tree: TestExplorerSection, fileName: string): Promise<TreeItem> {
	return await waitFor(`${fileName} in the ${PARSER_FOLDER} folder`, async () => {
		const folder = await findShownItem(tree, PARSER_FOLDER);
		if (!folder) {
			return undefined;
		}
		await folder.expand();
		const file = await findShownItem(tree, fileName);
		await file?.expand();
		return file;
	});
}

/**
 * Collapses a test file again, so that the next test finds its file among few rows.
 * The Testing view renders only the rows in sight, so a long expanded tree hides the next file.
 *
 * @param {TestExplorerSection} tree - The tree section.
 * @param {string} fileName - The test file name.
 */
async function closeTestFile(tree: TestExplorerSection, fileName: string): Promise<void> {
	try {
		await (await findShownItem(tree, fileName))?.collapse();
	} catch {
		// The next test expands what it needs; a row that is gone needs no collapsing.
	}
}

/**
 * Returns the children of an item once it shows the expected number of children.
 *
 * @param {TreeItem} item - The tree item to expand.
 * @param {number} count - The expected number of children.
 * @returns {Promise<TreeItem[]>} The children.
 */
async function getChildren(item: TreeItem, count: number): Promise<TreeItem[]> {
	return await waitFor(`${count} children of ${await item.getLabel()}`, async () => {
		const children = await item.getChildren();
		return children.length === count ? children : undefined;
	});
}

/**
 * Main test suite for ExTester Tree Provider verification
 *
 * This suite contains tests that verify the proper parsing and display of test files
 * in the VS Code test explorer tree view. It tests various test file structures including
 * simple tests, tests with modifiers, tests with variables, and complex nested test structures.
 */
describe('Parser test suite', function () {
	this.timeout(60000);

	let tree: TestExplorerSection;
	let openFile: string | undefined;

	/**
	 * Setup function that runs before all tests
	 * Configures the test file glob setting and opens the example project
	 */
	before(async function () {
		this.timeout(60000);

		const browser = VSBrowser.instance;
		await browser.openResources(EXAMPLE_PROJECT, async () => {
			await browser.driver.sleep(3_000);
		});

		await updateSettings(TEST_FILE_GLOB_SETTINGS_ID, TEST_FILE_GLOB);

		// Wait until the tests are discovered again with the new glob: the actions folder is gone.
		tree = await getTestExplorer();
		await waitFor(`The ${PARSER_FOLDER} folder without the ${ACTIONS_FOLDER} folder`, async () => {
			const items = await tree.getVisibleItems();
			const labels = await Promise.all(items.map((item) => item.getLabel()));
			const discovered = labels.some((label) => label.includes(PARSER_FOLDER)) && !labels.some((label) => label.includes(ACTIONS_FOLDER));
			return discovered ? labels : undefined;
		});
	});

	/**
	 * Collapses the file of the finished test
	 */
	afterEach(async function () {
		if (openFile) {
			await closeTestFile(tree, openFile);
			openFile = undefined;
		}
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
	 * Expands a test file and remembers it, so that it is collapsed after the test.
	 */
	async function open(fileName: string): Promise<TreeItem> {
		openFile = fileName;
		tree = await getTestExplorer();
		return await openTestFile(tree, fileName);
	}

	/**
	 * Verifies parsing of a simple test file with no modifiers
	 * Tests that the describe and it blocks are correctly displayed in the tree view
	 */
	it('simpleFile.test.ts', async function () {
		const EXPECTED_DESCRIBE = 'Simple suite without modifier';
		const EXPECTED_TEST = 'Simple test without modifier';

		const item = await open(SIMPLE_FILE);

		// Verify describe block
		const [firstDescribe] = await getChildren(item, 1);
		assert.strictEqual((await firstDescribe.getLabel()).trim(), EXPECTED_DESCRIBE);

		// Verify test block
		const [firstIt] = await getChildren(firstDescribe, 1);
		assert.strictEqual((await firstIt.getLabel()).trim(), EXPECTED_TEST);
	});

	/**
	 * Verifies parsing of a test file with modifiers
	 * Tests that the describe.only and it.skip modifiers are correctly displayed in the tree view
	 */
	it('simpleFileWithModifier.test.ts', async function () {
		const EXPECTED_DESCRIBE = 'Simple suite with only modifier';
		const EXPECTED_DESCRIBE_MODIFIER = 'only';
		const EXPECTED_TEST = 'Simple test with skip modifier';
		const EXPECTED_TEST_MODIFIER = 'skip';

		const item = await open(SIMPLE_FILE_WITH_MODIFIERS);

		// Verify describe block
		const [firstDescribe] = await getChildren(item, 1);
		assert.strictEqual((await firstDescribe.getLabel()).trim(), EXPECTED_DESCRIBE);
		assert.strictEqual(await firstDescribe.getDescription(), EXPECTED_DESCRIBE_MODIFIER);

		// Verify test block
		const [firstIt] = await getChildren(firstDescribe, 1);
		assert.strictEqual((await firstIt.getLabel()).trim(), EXPECTED_TEST);
		assert.strictEqual(await firstIt.getDescription(), EXPECTED_TEST_MODIFIER);
	});

	/**
	 * Verifies parsing of a test file with variables
	 * Tests that variables in describe and it blocks are correctly displayed in the tree view
	 */
	it('simpleFileWithVariable.test.ts', async function () {
		const EXPECTED_DESCRIBE = 'Simple suite with ${variable}';
		const EXPECTED_TEST = 'Simple test with ${variable}';

		const item = await open(SIMPLE_FILE_WITH_VARIABLES);

		// Verify describe block
		const [firstDescribe] = await getChildren(item, 1);
		assert.strictEqual((await firstDescribe.getLabel()).trim(), EXPECTED_DESCRIBE);

		// Verify test block
		const [firstIt] = await getChildren(firstDescribe, 1);
		assert.strictEqual((await firstIt.getLabel()).trim(), EXPECTED_TEST);
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

		const item = await open(MULTIPLE_ROOT_DESCRIBES);

		// Verify describe blocks
		const [firstDescribe, secondDescribe] = await getChildren(item, 2);
		assert.strictEqual((await firstDescribe.getLabel()).trim(), EXPECTED_DESCRIBE_1);
		assert.strictEqual((await secondDescribe.getLabel()).trim(), EXPECTED_DESCRIBE_2);

		// Verify the test of each describe block
		const [firstIt] = await getChildren(firstDescribe, 1);
		assert.strictEqual((await firstIt.getLabel()).trim(), EXPECTED_TEST_1);

		// The children of the first describe block come before the second one: find it again.
		const [, secondDescribeAgain] = await getChildren(item, 2);
		const [secondIt] = await getChildren(secondDescribeAgain, 1);
		assert.strictEqual((await secondIt.getLabel()).trim(), EXPECTED_TEST_2);
	});
});
