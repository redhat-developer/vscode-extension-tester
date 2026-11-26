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

import * as assert from 'assert';
import * as vscode from 'vscode';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { parseTestFile } from '../../utils/parser';
import { ItBlock, TestBlock } from '../../types/testTypes';
import { Logger } from '../../logger/logger';
import path from 'path';
import {
	BDD_ALIASES_FILE,
	COMPLEX_FILE,
	MOD_ONLY,
	MOD_SKIP,
	MULTIPLE_ROOT_DESCRIBES,
	SIMPLE_FILE,
	SIMPLE_FILE_WITH_MODIFIERS,
	SIMPLE_FILE_WITH_VARIABLES,
	TDD_FILE,
	TEST_RESOURCES_PATH,
} from '../utils/testUtils';

/**
 * Dummy implementation of vscode.OutputChannel for testing purposes.
 * All methods are implemented as no-ops to avoid actual output during tests.
 */
const dummyOutputChannel: vscode.OutputChannel = {
	append: (): void => {},
	appendLine: (): void => {},
	clear: (): void => {},
	replace: (): void => {},
	show: function (): void {
		// no-op implementation
	},
	hide: (): void => {},
	dispose: (): void => {},
	name: 'dummy',
};

/**
 * Dummy implementation of Logger for testing purposes.
 * Extends the base Logger class and overrides all logging methods as no-ops.
 */
class DummyLogger extends Logger {
	constructor() {
		// Pass the dummy output channel to the parent class constructor.
		super(dummyOutputChannel);
	}
	// Override the logging methods to no-op implementations.
	debug(): void {
		// empty debug method since we don't want to output logs during tests
	}
	info(): void {
		// empty info method since we don't want to output logs during tests
	}
	error(): void {
		// empty error method since we don't want to output logs during tests
	}
}

// Create an instance of DummyLogger to use in tests.
const dummyLogger = new DummyLogger();

/**
 * Helper function to assert the properties of a TestBlock.
 * Verifies all key properties of a test suite block match expected values.
 */
function assertTestBlock(
	block: TestBlock,
	{
		childrenLength,
		describe,
		itsLength,
		line,
		modifier,
		parentModifier,
		fileName,
	}: {
		childrenLength: number;
		describe: string;
		itsLength: number;
		line: number;
		modifier: string | null;
		parentModifier: string | undefined;
		fileName: string;
	},
) {
	assert.strictEqual(block.children.length, childrenLength);
	assert.strictEqual(block.describe, describe);
	assert.ok(block.filePath.endsWith(fileName));
	assert.strictEqual(block.its.length, itsLength);
	assert.strictEqual(block.line, line);
	assert.strictEqual(block.modifier, modifier);
	assert.strictEqual(block.parentModifier, parentModifier);
}

/**
 * Helper function to assert the properties of an ItBlock.
 * Verifies all key properties of a test case block match expected values.
 */
function assertItBlock(
	testCase: ItBlock,
	{
		name,
		line,
		modifier,
		parentModifier,
		fileName,
	}: {
		name: string;
		line: number;
		modifier: string | null;
		parentModifier: string | undefined;
		fileName: string;
	},
) {
	assert.strictEqual(testCase.name, name);
	assert.strictEqual(testCase.describeModifier, undefined); // maybe not necessary at all in the type structure?
	assert.ok(testCase.filePath.endsWith(fileName));
	assert.strictEqual(testCase.line, line);
	assert.strictEqual(testCase.modifier, modifier);
	assert.strictEqual(testCase.parentModifier, parentModifier);
}

/**
 * This test suite verifies the functionality of the test file parser utility.
 * The parser is responsible for analyzing test files and extracting their structure.
 *
 * Currently implemented features:
 * 1. Detecting describe blocks and their modifiers (only, skip)
 * 2. Finding individual test cases and their modifiers
 * 3. Tracking line numbers and file paths for navigation
 * 4. Maintaining parent-child relationships between test blocks
 * 5. Parsing simple test files with single describe blocks
 * 6. Handling nested describe blocks and their inheritance of modifiers
 * 7. Handling test files with multiple describe blocks at different nesting levels
 * 8. Processing test files with various modifier combinations
 * 9. Validating modifier inheritance between parent and child blocks
 * 10. Reading the BDD aliases (`context`, `specify`, `xit`, ...) and the TDD interface
 *
 * To be done:
 * 1. Proper handling of empty describe blocks
 * 2. Processing of test files with only test cases (no describe blocks)
 *
 * The test suite currently focuses on basic parsing functionality with plans
 * to expand coverage as additional features are implemented.
 */
describe('Parser Utility Tests', () => {
	/**
	 * Tests parsing of a simple test file containing:
	 * - One describe block without modifiers
	 * - One test case without modifiers
	 */
	it('Parses a simple file with one describe and one test without modifiers', async () => {
		// Setup: Open the test file
		const resourcePath = path.join(TEST_RESOURCES_PATH, SIMPLE_FILE);
		const uri = vscode.Uri.file(resourcePath);
		const doc = await vscode.workspace.openTextDocument(uri);

		// Execute: Parse the test file
		const structure = await parseTestFile(doc.uri, dummyLogger);
		assert.strictEqual(structure.length, 1); // Verify only one describe block exists

		// Assert: Verify the describe block properties
		const suiteBlock: TestBlock = structure[0];
		assertTestBlock(suiteBlock, {
			childrenLength: 0,
			describe: 'Simple suite without modifier',
			itsLength: 1,
			line: 1,
			modifier: null,
			parentModifier: undefined,
			fileName: SIMPLE_FILE,
		});

		// Assert: Verify the test case properties
		const testCase = suiteBlock.its[0] as unknown as ItBlock;
		assertItBlock(testCase, {
			name: 'Simple test without modifier',
			line: 2,
			modifier: null,
			parentModifier: undefined,
			fileName: SIMPLE_FILE,
		});
	});

	/**
	 * Tests parsing of a test file containing:
	 * - One describe block with 'only' modifier
	 * - One test case with 'skip' modifier
	 */
	it('Parses a simple file with one describe and one test with modifiers', async () => {
		// Setup: Open the test file
		const resourcePath = path.join(TEST_RESOURCES_PATH, SIMPLE_FILE_WITH_MODIFIERS);
		const uri = vscode.Uri.file(resourcePath);
		const doc = await vscode.workspace.openTextDocument(uri);

		// Execute: Parse the test file
		const structure = await parseTestFile(doc.uri, dummyLogger);
		assert.strictEqual(structure.length, 1); // Verify only one describe block exists

		// Assert: Verify the describe block properties
		const suiteBlock: TestBlock = structure[0];
		assertTestBlock(suiteBlock, {
			childrenLength: 0,
			describe: 'Simple suite with only modifier',
			itsLength: 1,
			line: 1,
			modifier: MOD_ONLY,
			parentModifier: undefined,
			fileName: SIMPLE_FILE_WITH_MODIFIERS,
		});

		// Assert: Verify the test case properties
		const testCase = suiteBlock.its[0] as unknown as ItBlock;
		assertItBlock(testCase, {
			name: 'Simple test with skip modifier',
			line: 2,
			modifier: MOD_SKIP,
			parentModifier: MOD_ONLY,
			fileName: SIMPLE_FILE_WITH_MODIFIERS,
		});
	});

	/**
	 * Tests parsing of a test file containing:
	 * - One describe block with variable interpolation in name
	 * - One test case with variable interpolation in name
	 */
	it('Parses a simple file with variable in name', async () => {
		// Setup: Open the test file
		const resourcePath = path.join(TEST_RESOURCES_PATH, SIMPLE_FILE_WITH_VARIABLES);
		const uri = vscode.Uri.file(resourcePath);
		const doc = await vscode.workspace.openTextDocument(uri);

		// Execute: Parse the test file
		const structure = await parseTestFile(doc.uri, dummyLogger);
		assert.strictEqual(structure.length, 1); // Verify only one describe block exists

		// Assert: Verify the describe block properties
		const suiteBlock: TestBlock = structure[0];
		assertTestBlock(suiteBlock, {
			childrenLength: 0,
			describe: 'Simple suite with ${variable}',
			itsLength: 1,
			line: 2,
			modifier: null,
			parentModifier: undefined,
			fileName: SIMPLE_FILE_WITH_VARIABLES,
		});

		// Assert: Verify the test case properties
		const testCase = suiteBlock.its[0] as unknown as ItBlock;
		assertItBlock(testCase, {
			name: 'Simple test with ${variable}',
			line: 3,
			modifier: null,
			parentModifier: undefined,
			fileName: SIMPLE_FILE_WITH_VARIABLES,
		});
	});

	/**
	 * Tests parsing of a complex test file containing:
	 * - Multiple nested describe blocks with various modifiers
	 * - Multiple test cases with various modifiers
	 * - Tests inheritance of modifiers from parent blocks
	 */
	it('Parses a complex file with huge variability of modifiers', async () => {
		// Setup: Open the test file
		const resourcePath = path.join(TEST_RESOURCES_PATH, COMPLEX_FILE);
		const uri = vscode.Uri.file(resourcePath);
		const doc = await vscode.workspace.openTextDocument(uri);

		// Execute: Parse the test file
		const structure = await parseTestFile(doc.uri, dummyLogger);
		assert.strictEqual(structure.length, 1); // Verify only one root describe block exists

		// Assert: Verify root suite block properties
		const rootSuiteBlock: TestBlock = structure[0];
		assertTestBlock(rootSuiteBlock, {
			childrenLength: 1,
			describe: 'Root suite modifier: no parentModifier: no',
			itsLength: 3,
			line: 1,
			modifier: null,
			parentModifier: undefined,
			fileName: COMPLEX_FILE,
		});

		// Assert: Verify root suite test cases
		assertItBlock(rootSuiteBlock.its[0] as unknown as ItBlock, {
			name: 'Root test 1 modifier: no parentModifier: no',
			line: 2,
			modifier: null,
			parentModifier: undefined,
			fileName: COMPLEX_FILE,
		});

		assertItBlock(rootSuiteBlock.its[1] as unknown as ItBlock, {
			name: 'Root test 2 modifier: skip parentModifier: no',
			line: 3,
			modifier: MOD_SKIP,
			parentModifier: undefined,
			fileName: COMPLEX_FILE,
		});

		assertItBlock(rootSuiteBlock.its[2] as unknown as ItBlock, {
			name: 'Root test 3 modifier: only parentModifier: no',
			line: 4,
			modifier: MOD_ONLY,
			parentModifier: undefined,
			fileName: COMPLEX_FILE,
		});

		// Assert: Verify child suite block properties
		const childSuiteBlock = rootSuiteBlock.children[0] as unknown as TestBlock;
		assertTestBlock(childSuiteBlock, {
			childrenLength: 2,
			describe: 'Child suite modifier: only parentModifier: no',
			itsLength: 4,
			line: 6,
			modifier: MOD_ONLY,
			parentModifier: undefined,
			fileName: COMPLEX_FILE,
		});

		// Assert: Verify child suite test cases
		assertItBlock(childSuiteBlock.its[0] as unknown as ItBlock, {
			name: 'Child test 1 modifier: no parentModifier: only',
			line: 7,
			modifier: null,
			parentModifier: MOD_ONLY,
			fileName: COMPLEX_FILE,
		});

		assertItBlock(childSuiteBlock.its[1] as unknown as ItBlock, {
			name: 'Child test 2 modifier: skip parentModifier: only',
			line: 8,
			modifier: MOD_SKIP,
			parentModifier: MOD_ONLY,
			fileName: COMPLEX_FILE,
		});

		assertItBlock(childSuiteBlock.its[2] as unknown as ItBlock, {
			name: 'Child test 3 modifier: no parentModifier: only',
			line: 9,
			modifier: null,
			parentModifier: MOD_ONLY,
			fileName: COMPLEX_FILE,
		});

		assertItBlock(childSuiteBlock.its[3] as unknown as ItBlock, {
			name: 'Child test 4 modifier: only parentModifier: only',
			line: 10,
			modifier: MOD_ONLY,
			parentModifier: MOD_ONLY,
			fileName: COMPLEX_FILE,
		});

		// Assert: Verify first grandchild suite block properties
		const grandchildSuiteBlock1 = childSuiteBlock.children[0] as unknown as TestBlock;
		assertTestBlock(grandchildSuiteBlock1, {
			childrenLength: 0,
			describe: 'Grandchild suite 1 modifier: no parentModifier: only',
			itsLength: 5,
			line: 12,
			modifier: null,
			parentModifier: MOD_ONLY,
			fileName: COMPLEX_FILE,
		});

		// Assert: Verify first grandchild suite test cases
		assertItBlock(grandchildSuiteBlock1.its[0] as unknown as ItBlock, {
			name: 'Grandchild suite 1 test 1 modifier: no parentModifier: only',
			line: 13,
			modifier: null,
			parentModifier: MOD_ONLY,
			fileName: COMPLEX_FILE,
		});

		assertItBlock(grandchildSuiteBlock1.its[1] as unknown as ItBlock, {
			name: 'Grandchild suite 1 test 2 modifier: skip parentModifier: only',
			line: 14,
			modifier: MOD_SKIP,
			parentModifier: MOD_ONLY,
			fileName: COMPLEX_FILE,
		});

		assertItBlock(grandchildSuiteBlock1.its[2] as unknown as ItBlock, {
			name: 'Grandchild suite 1 test 3 modifier: no parentModifier: only',
			line: 15,
			modifier: null,
			parentModifier: MOD_ONLY,
			fileName: COMPLEX_FILE,
		});

		assertItBlock(grandchildSuiteBlock1.its[3] as unknown as ItBlock, {
			name: 'Grandchild suite 1 test 4 modifier: only parentModifier: only',
			line: 16,
			modifier: MOD_ONLY,
			parentModifier: MOD_ONLY,
			fileName: COMPLEX_FILE,
		});

		assertItBlock(grandchildSuiteBlock1.its[4] as unknown as ItBlock, {
			name: 'Grandchild suite 1 test 5 modifier: no parentModifier: only',
			line: 17,
			modifier: null,
			parentModifier: MOD_ONLY,
			fileName: COMPLEX_FILE,
		});

		// Assert: Verify second grandchild suite block properties
		const grandchildSuiteBlock2 = childSuiteBlock.children[1] as unknown as TestBlock;
		assertTestBlock(grandchildSuiteBlock2, {
			childrenLength: 0,
			describe: 'Grandchild suite 2 modifier: skip parentModifier: only',
			itsLength: 6,
			line: 20,
			modifier: MOD_SKIP,
			parentModifier: MOD_ONLY,
			fileName: COMPLEX_FILE,
		});

		// Assert: Verify second grandchild suite test cases
		assertItBlock(grandchildSuiteBlock2.its[0] as unknown as ItBlock, {
			name: 'Grandchild suite 2 test 1 modifier: no parentModifier: skip',
			line: 21,
			modifier: null,
			parentModifier: MOD_SKIP,
			fileName: COMPLEX_FILE,
		});

		assertItBlock(grandchildSuiteBlock2.its[1] as unknown as ItBlock, {
			name: 'Grandchild suite 2 test 2 modifier: skip parentModifier: skip',
			line: 22,
			modifier: MOD_SKIP,
			parentModifier: MOD_SKIP,
			fileName: COMPLEX_FILE,
		});

		assertItBlock(grandchildSuiteBlock2.its[2] as unknown as ItBlock, {
			name: 'Grandchild suite 2 test 3 modifier: no parentModifier: skip',
			line: 23,
			modifier: null,
			parentModifier: MOD_SKIP,
			fileName: COMPLEX_FILE,
		});

		assertItBlock(grandchildSuiteBlock2.its[3] as unknown as ItBlock, {
			name: 'Grandchild suite 2 test 4 modifier: only parentModifier: skip',
			line: 24,
			modifier: MOD_ONLY,
			parentModifier: MOD_SKIP,
			fileName: COMPLEX_FILE,
		});

		assertItBlock(grandchildSuiteBlock2.its[4] as unknown as ItBlock, {
			name: 'Grandchild suite 2 test 5 modifier: no parentModifier: skip',
			line: 25,
			modifier: null,
			parentModifier: MOD_SKIP,
			fileName: COMPLEX_FILE,
		});

		assertItBlock(grandchildSuiteBlock2.its[5] as unknown as ItBlock, {
			name: 'Grandchild suite 2 test 6 modifier: no parentModifier: skip',
			line: 26,
			modifier: null,
			parentModifier: MOD_SKIP,
			fileName: COMPLEX_FILE,
		});
	});

	/**
	 * Tests parsing of a test file containing:
	 * - Multiple root-level describe blocks
	 * - Each describe block contains one test case
	 */
	it('Parses a file with more than one root describe', async () => {
		// Setup: Open the test file
		const resourcePath = path.join(TEST_RESOURCES_PATH, MULTIPLE_ROOT_DESCRIBES);
		const uri = vscode.Uri.file(resourcePath);
		const doc = await vscode.workspace.openTextDocument(uri);

		// Execute: Parse the test file
		const structure = await parseTestFile(doc.uri, dummyLogger);
		assert.strictEqual(structure.length, 2); // Verify two root describe blocks exist

		// Assert: Verify first root suite block properties
		const suiteBlock1: TestBlock = structure[0];
		assertTestBlock(suiteBlock1, {
			childrenLength: 0,
			describe: 'Root suite 1',
			itsLength: 1,
			line: 1,
			modifier: null,
			parentModifier: undefined,
			fileName: MULTIPLE_ROOT_DESCRIBES,
		});

		// Assert: Verify first root suite test case
		assertItBlock(suiteBlock1.its[0] as unknown as ItBlock, {
			name: 'Root suite 1 test 1',
			line: 2,
			modifier: null,
			parentModifier: undefined,
			fileName: MULTIPLE_ROOT_DESCRIBES,
		});

		// Assert: Verify second root suite block properties
		const suiteBlock2: TestBlock = structure[1];
		assertTestBlock(suiteBlock2, {
			childrenLength: 0,
			describe: 'Root suite 2',
			itsLength: 1,
			line: 5,
			modifier: null,
			parentModifier: undefined,
			fileName: MULTIPLE_ROOT_DESCRIBES,
		});

		// Assert: Verify second root suite test case
		assertItBlock(suiteBlock2.its[0] as unknown as ItBlock, {
			name: 'Root suite 2 test 1',
			line: 6,
			modifier: null,
			parentModifier: undefined,
			fileName: MULTIPLE_ROOT_DESCRIBES,
		});
	});
});

/**
 * Lists a parsed structure as indented lines, one per suite and test, with its line and its own and
 * inherited modifiers, so the structure of a whole file can be compared at once.
 */
function outline(blocks: TestBlock[], indent = ''): string[] {
	return blocks.flatMap((block) => [
		`${indent}suite ${block.describe} @${block.line}${modifiers(block)}`,
		...block.its.map((test) => `${indent}  test ${test.name} @${test.line}${modifiers(test)}`),
		...outline(block.children, `${indent}  `),
	]);
}

function modifiers(block: TestBlock | ItBlock): string {
	const parts = [block.modifier, block.parentModifier && `in ${block.parentModifier}`].filter(Boolean);
	return parts.length > 0 ? ` (${parts.join(', ')})` : '';
}

/** Parses a test resource and checks that every suite and test has the path of the file. */
async function parseResource(fileName: string): Promise<TestBlock[]> {
	const structure = await parseTestFile(vscode.Uri.file(path.join(TEST_RESOURCES_PATH, fileName)), dummyLogger);
	const assertFilePath = (blocks: TestBlock[]): void =>
		blocks.forEach((block) => {
			assert.ok(block.filePath.endsWith(fileName));
			block.its.forEach((test) => assert.ok(test.filePath.endsWith(fileName)));
			assertFilePath(block.children);
		});
	assertFilePath(structure);
	return structure;
}

/** Parses a test file with the given lines. */
async function parseLines(...lines: string[]): Promise<TestBlock[]> {
	const folder = await mkdtemp(path.join(tmpdir(), 'extester-runner-parser-'));
	try {
		const file = path.join(folder, 'source.test.ts');
		await writeFile(file, lines.join('\n'));
		return await parseTestFile(vscode.Uri.file(file), dummyLogger);
	} finally {
		await rm(folder, { recursive: true, force: true });
	}
}

/**
 * Mocha's `ui` option selects how test files define their suites and tests. The parser reads the
 * BDD and TDD interfaces, so the Testing view lists the tests of a project that uses either.
 */
describe('Parser Mocha interfaces', () => {
	it('Parses the BDD aliases context and specify and the skipping x functions', async () => {
		assert.deepStrictEqual(outline(await parseResource(BDD_ALIASES_FILE)), [
			'suite Context suite @1',
			'  test Specify test @2',
			'  test Skipped it @3 (skip)',
			'  test Skipped specify @4 (skip)',
			'  suite Nested context @5 (only)',
			'    test Skipped nested specify @6 (skip, in only)',
			'suite Skipped describe @10 (skip)',
			'  test Test of skipped describe @12 (in skip)', // `it.retries(2)` on line 11 is not a test
		]);
	});

	it('Parses TDD suites and tests with their modifiers', async () => {
		assert.deepStrictEqual(outline(await parseResource(TDD_FILE)), [
			'suite Calculator @1',
			'  test adds @4',
			'  test subtracts @5 (skip)',
			'  suite Advanced @7 (only)',
			'    test multiplies @8 (in only)',
			'    test divides @9 (only, in only)',
			'suite Strings @14 (skip)',
			'  test concatenates @15 (in skip)',
		]);
	});

	it('Reads a BDD file as BDD although it calls a helper named like a TDD function', async () => {
		const structure = await parseLines(
			'function test(name: string): string {',
			'\treturn name;',
			'}',
			"describe('Suite', () => {",
			"\tit('works', () => test('helper'));",
			'});',
		);
		assert.deepStrictEqual(outline(structure), ['suite Suite @4', '  test works @5']);
	});

	it('Ignores local helpers named like Mocha functions in a TDD file', async () => {
		const structure = await parseLines(
			'function context(name: string): string {',
			'\treturn name;',
			'}',
			"suite('Suite', () => {",
			"\tcontext('not a suite');",
			"\ttest('works', () => {",
			'\t\tconst test = (title: string): string => title;',
			"\t\ttest('helper call');",
			'\t});',
			'});',
		);
		assert.deepStrictEqual(outline(structure), ['suite Suite @4', '  test works @6']);
	});

	it('Reads Mocha functions imported or required from mocha, also under another name', async () => {
		const imported = await parseLines("import { suite as group, test } from 'mocha';", "group('Suite', () => {", "\ttest('works', () => {});", '});');
		assert.deepStrictEqual(outline(imported), ['suite Suite @2', '  test works @3']);
		const required = await parseLines(
			"const { describe, it: check } = require('mocha');",
			"describe('Suite', () => {",
			"\tcheck.skip('works', () => {});",
			'});',
		);
		assert.deepStrictEqual(outline(required), ['suite Suite @2', '  test works @3 (skip)']);
	});

	it('Ignores functions named like Mocha functions that are imported from another module', async () => {
		const structure = await parseLines("import { suite, test } from './helpers';", "suite('Suite', () => {", "\ttest('works', () => {});", '});');
		assert.deepStrictEqual(structure, []);
	});

	it('Lists no suite for a suite call without a callback, as in the QUnit interface', async () => {
		assert.deepStrictEqual(await parseLines("suite('Array');", "test('push', () => {});"), []);
	});

	it('Lists nothing in a file without suites or tests', async () => {
		assert.deepStrictEqual(await parseLines("export const helper = { works: () => 'value' };"), []);
	});
});
