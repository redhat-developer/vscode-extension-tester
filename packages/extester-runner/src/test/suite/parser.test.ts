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
import { parseTestFile } from '../../utils/parser';
import { ItBlock, TestBlock } from '../../types/testTypes';
import { Logger } from '../../logger/logger';
import path from 'path';

// Create a dummy output channel that implements the vscode.OutputChannel interface.
const dummyOutputChannel: vscode.OutputChannel = {
	append: (value: string): void => {},
	appendLine: (value: string): void => {},
	clear: (): void => {},
	replace: (value: string): void => {},
	show: function (arg?: vscode.ViewColumn | boolean, preserveFocus?: boolean): void {
		// No-op implementation: ignore arguments.
	},
	hide: (): void => {},
	dispose: (): void => {},
	name: 'dummy',
};

// Create a dummy subclass of Logger which accepts the output channel as required.
class DummyLogger extends Logger {
	constructor() {
		// Pass the dummy output channel to the parent class constructor.
		super(dummyOutputChannel);
	}
	// Override the logging methods to no-op implementations.
	debug(message?: any, ...optionalParams: any[]): void {}
	info(message?: any, ...optionalParams: any[]): void {}
	error(message?: any, ...optionalParams: any[]): void {}
}

// Create an instance of DummyLogger to use in tests.
const dummyLogger = new DummyLogger();

describe('Parser Utility Tests', () => {
	it('Parses a simple file with one describe and one test without modifiers', async () => {
		// Open example test.
		const resourcePath = path.join(__dirname, '..', '..', '..', 'src', 'test', 'resources', 'simpleFile.ts');
		const uri = vscode.Uri.file(resourcePath);
		const doc = await vscode.workspace.openTextDocument(uri);

		// Parse the test file and load structure.
		const structure = await parseTestFile(doc.uri, dummyLogger);
		assert.strictEqual(structure.length, 1); // only one describe is expected

		// Check describe.
		const suiteBlock: TestBlock = structure[0];
		assert.strictEqual(suiteBlock.children.length, 0); // no describes inside
		assert.strictEqual(suiteBlock.describe, 'Simple suite without modifier');
		assert.ok(suiteBlock.filePath.endsWith('simpleFile.ts'));
		assert.strictEqual(suiteBlock.its.length, 1); // only one it inside
		assert.strictEqual(suiteBlock.line, 1);
		assert.strictEqual(suiteBlock.modifier, null);
		assert.strictEqual(suiteBlock.parentModifier, undefined);

		// Check it.
		const testCase = suiteBlock.its[0] as unknown as ItBlock;
		assert.strictEqual(testCase.name, 'Simple test without modifier');
		assert.strictEqual(testCase.describeModifier, undefined); // TODO: Is it necessary to have this inside the test type structure?
		assert.ok(testCase.filePath.endsWith('simpleFile.ts'));
		assert.strictEqual(testCase.line, 2);
		assert.strictEqual(testCase.modifier, null);
		assert.strictEqual(testCase.parentModifier, undefined);
	});

	it('Parses a simple file with one describe and one test with modifiers', async () => {
		// Open example test.
		const resourcePath = path.join(__dirname, '..', '..', '..', 'src', 'test', 'resources', 'simpleFileWithModifiers.ts');
		const uri = vscode.Uri.file(resourcePath);
		const doc = await vscode.workspace.openTextDocument(uri);

		// Parse the test file and load structure.
		const structure = await parseTestFile(doc.uri, dummyLogger);
		assert.strictEqual(structure.length, 1); // only one describe is expected

		// Check describe.
		const suiteBlock: TestBlock = structure[0];
		assert.strictEqual(suiteBlock.children.length, 0); // no describes inside
		assert.strictEqual(suiteBlock.describe, 'Simple suite with only modifier');
		assert.ok(suiteBlock.filePath.endsWith('simpleFileWithModifiers.ts'));
		assert.strictEqual(suiteBlock.its.length, 1); // only one it inside
		assert.strictEqual(suiteBlock.line, 1);
		assert.strictEqual(suiteBlock.modifier, 'only'); // only modifier
		assert.strictEqual(suiteBlock.parentModifier, undefined);

		// Check it.
		const testCase = suiteBlock.its[0] as unknown as ItBlock;
		assert.strictEqual(testCase.name, 'Simple test with skip modifier');
		assert.strictEqual(testCase.describeModifier, undefined); // TODO: Is it necessary to have this inside the test type structure?
		assert.ok(testCase.filePath.endsWith('simpleFileWithModifiers.ts'));
		assert.strictEqual(testCase.line, 2);
		assert.strictEqual(testCase.modifier, 'skip');
		assert.strictEqual(testCase.parentModifier, 'only'); // parent has only modifier
	});

	it('Parses a simple file with variable in name', async () => {
		// Open example test.
		const resourcePath = path.join(__dirname, '..', '..', '..', 'src', 'test', 'resources', 'simpleFileWithVariable.ts');
		const uri = vscode.Uri.file(resourcePath);
		const doc = await vscode.workspace.openTextDocument(uri);

		// Parse the test file and load structure.
		const structure = await parseTestFile(doc.uri, dummyLogger);
		assert.strictEqual(structure.length, 1); // only one describe is expected

		// Check describe.
		const suiteBlock: TestBlock = structure[0];
		assert.strictEqual(suiteBlock.children.length, 0); // no describes inside
		assert.strictEqual(suiteBlock.describe, 'Simple suite with ${variable}');
		assert.ok(suiteBlock.filePath.endsWith('simpleFileWithVariable.ts'));
		assert.strictEqual(suiteBlock.its.length, 1); // only one it inside
		assert.strictEqual(suiteBlock.line, 2);
		assert.strictEqual(suiteBlock.modifier, null); // only modifier
		assert.strictEqual(suiteBlock.parentModifier, undefined);

		// Check it.
		const testCase = suiteBlock.its[0] as unknown as ItBlock;
		assert.strictEqual(testCase.name, 'Simple test with ${variable}');
		assert.strictEqual(testCase.describeModifier, undefined); // TODO: Is it necessary to have this inside the test type structure?
		assert.ok(testCase.filePath.endsWith('simpleFileWithVariable.ts'));
		assert.strictEqual(testCase.line, 3);
		assert.strictEqual(testCase.modifier, null);
		assert.strictEqual(testCase.parentModifier, undefined); // parent has only modifier
	});

	it('Parses a complex file with huge variability of modifiers', async () => {
		const resourcePath = path.join(__dirname, '..', '..', '..', 'src', 'test', 'resources', 'parserTestFile.ts');
		const uri = vscode.Uri.file(resourcePath);
		const doc = await vscode.workspace.openTextDocument(uri);
		const COMPLEX_FILE = 'parserTestFile.ts';

		// Parse the test file and load structure.
		const structure = await parseTestFile(doc.uri, dummyLogger);
		assert.strictEqual(structure.length, 1); // only one root describe is expected

		const rootSuiteBlock: TestBlock = structure[0];
		// root suite
		assert.strictEqual(rootSuiteBlock.children.length, 1); // expected one child describe
		assert.strictEqual(rootSuiteBlock.describe, 'Root suite modifier: no parentModifier: no');
		assert.ok(rootSuiteBlock.filePath.endsWith(COMPLEX_FILE));
		assert.strictEqual(rootSuiteBlock.its.length, 3); // three tests inside
		assert.strictEqual(rootSuiteBlock.line, 1);
		assert.strictEqual(rootSuiteBlock.modifier, null);
		assert.strictEqual(rootSuiteBlock.parentModifier, undefined);

		// root suite - its
		const rootSuiteTest1 = rootSuiteBlock.its[0] as unknown as ItBlock;
		assert.strictEqual(rootSuiteTest1.name, 'Root test 1 modifier: no parentModifier: no');
		assert.strictEqual(rootSuiteTest1.describeModifier, undefined); // TODO: Is it necessary to have this inside the test type structure?
		assert.ok(rootSuiteTest1.filePath.endsWith(COMPLEX_FILE));
		assert.strictEqual(rootSuiteTest1.line, 2);
		assert.strictEqual(rootSuiteTest1.modifier, null);
		assert.strictEqual(rootSuiteTest1.parentModifier, undefined);

		const rootSuiteTest2 = rootSuiteBlock.its[1] as unknown as ItBlock;
		assert.strictEqual(rootSuiteTest2.name, 'Root test 2 modifier: skip parentModifier: no');
		assert.strictEqual(rootSuiteTest2.describeModifier, undefined); // TODO: Is it necessary to have this inside the test type structure?
		assert.ok(rootSuiteTest2.filePath.endsWith(COMPLEX_FILE));
		assert.strictEqual(rootSuiteTest2.line, 3);
		assert.strictEqual(rootSuiteTest2.modifier, 'skip');
		assert.strictEqual(rootSuiteTest2.parentModifier, undefined);

		const rootSuiteTest3 = rootSuiteBlock.its[2] as unknown as ItBlock;
		assert.strictEqual(rootSuiteTest3.name, 'Root test 3 modifier: only parentModifier: no');
		assert.strictEqual(rootSuiteTest3.describeModifier, undefined); // TODO: Is it necessary to have this inside the test type structure?
		assert.ok(rootSuiteTest3.filePath.endsWith(COMPLEX_FILE));
		assert.strictEqual(rootSuiteTest3.line, 4);
		assert.strictEqual(rootSuiteTest3.modifier, 'only');
		assert.strictEqual(rootSuiteTest3.parentModifier, undefined);

		// child suite
		const childSuiteBlock = rootSuiteBlock.children[0] as unknown as TestBlock;
		assert.strictEqual(childSuiteBlock.children.length, 2); // two grandchild describes
		assert.strictEqual(childSuiteBlock.describe, 'Child suite modifier: only parentModifier: no');
		assert.ok(childSuiteBlock.filePath.endsWith(COMPLEX_FILE));
		assert.strictEqual(childSuiteBlock.its.length, 4); // four tests inside
		assert.strictEqual(childSuiteBlock.line, 6);
		assert.strictEqual(childSuiteBlock.modifier, 'only'); // modifier: only
		assert.strictEqual(childSuiteBlock.parentModifier, undefined); // parentModifier: no

		// child suite - its
		const childSuiteTest1 = childSuiteBlock.its[0] as unknown as ItBlock;
		assert.strictEqual(childSuiteTest1.name, 'Child test 1 modifier: no parentModifier: only');
		assert.strictEqual(childSuiteTest1.describeModifier, undefined); // TODO: Is it necessary to have this inside the test type structure?
		assert.ok(childSuiteTest1.filePath.endsWith(COMPLEX_FILE));
		assert.strictEqual(childSuiteTest1.line, 7);
		assert.strictEqual(childSuiteTest1.modifier, null);
		assert.strictEqual(childSuiteTest1.parentModifier, 'only');

		const childSuiteTest2 = childSuiteBlock.its[1] as unknown as ItBlock;
		assert.strictEqual(childSuiteTest2.name, 'Child test 2 modifier: skip parentModifier: only');
		assert.strictEqual(childSuiteTest2.describeModifier, undefined); // TODO: Is it necessary to have this inside the test type structure?
		assert.ok(childSuiteTest2.filePath.endsWith(COMPLEX_FILE));
		assert.strictEqual(childSuiteTest2.line, 8);
		assert.strictEqual(childSuiteTest2.modifier, 'skip');
		assert.strictEqual(childSuiteTest2.parentModifier, 'only');

		const childSuiteTest3 = childSuiteBlock.its[2] as unknown as ItBlock;
		assert.strictEqual(childSuiteTest3.name, 'Child test 3 modifier: no parentModifier: only');
		assert.strictEqual(childSuiteTest3.describeModifier, undefined); // TODO: Is it necessary to have this inside the test type structure?
		assert.ok(childSuiteTest3.filePath.endsWith(COMPLEX_FILE));
		assert.strictEqual(childSuiteTest3.line, 9);
		assert.strictEqual(childSuiteTest3.modifier, null);
		assert.strictEqual(childSuiteTest3.parentModifier, 'only');

		const childSuiteTest4 = childSuiteBlock.its[3] as unknown as ItBlock;
		assert.strictEqual(childSuiteTest4.name, 'Child test 4 modifier: only parentModifier: only');
		assert.strictEqual(childSuiteTest4.describeModifier, undefined); // TODO: Is it necessary to have this inside the test type structure?
		assert.ok(childSuiteTest4.filePath.endsWith(COMPLEX_FILE));
		assert.strictEqual(childSuiteTest4.line, 10);
		assert.strictEqual(childSuiteTest4.modifier, 'only');
		assert.strictEqual(childSuiteTest4.parentModifier, 'only');

		// grandchild suite 1
		const grandchildSuiteBlock1 = childSuiteBlock.children[0] as unknown as TestBlock;
		assert.strictEqual(grandchildSuiteBlock1.children.length, 0);
		assert.strictEqual(grandchildSuiteBlock1.describe, 'Grandchild suite 1 modifier: no parentModifier: only');
		assert.ok(grandchildSuiteBlock1.filePath.endsWith(COMPLEX_FILE));
		assert.strictEqual(grandchildSuiteBlock1.its.length, 5);
		assert.strictEqual(grandchildSuiteBlock1.line, 12);
		assert.strictEqual(grandchildSuiteBlock1.modifier, null);
		assert.strictEqual(grandchildSuiteBlock1.parentModifier, 'only');

		// grandchild suite 1 its
		const grandchildSuite1Test1 = grandchildSuiteBlock1.its[0] as unknown as ItBlock;
		assert.strictEqual(grandchildSuite1Test1.name, 'Grandchild suite 1 test 1 modifier: no parentModifier: only');
		assert.strictEqual(grandchildSuite1Test1.describeModifier, undefined); // TODO: Is it necessary to have this inside the test type structure?
		assert.ok(grandchildSuite1Test1.filePath.endsWith(COMPLEX_FILE));
		assert.strictEqual(grandchildSuite1Test1.line, 13);
		assert.strictEqual(grandchildSuite1Test1.modifier, null);
		assert.strictEqual(grandchildSuite1Test1.parentModifier, 'only');

		const grandchildSuite1Test2 = grandchildSuiteBlock1.its[1] as unknown as ItBlock;
		assert.strictEqual(grandchildSuite1Test2.name, 'Grandchild suite 1 test 2 modifier: skip parentModifier: only');
		assert.strictEqual(grandchildSuite1Test2.describeModifier, undefined); // TODO: Is it necessary to have this inside the test type structure?
		assert.ok(grandchildSuite1Test2.filePath.endsWith(COMPLEX_FILE));
		assert.strictEqual(grandchildSuite1Test2.line, 14);
		assert.strictEqual(grandchildSuite1Test2.modifier, 'skip');
		assert.strictEqual(grandchildSuite1Test2.parentModifier, 'only');

		const grandchildSuite1Test3 = grandchildSuiteBlock1.its[2] as unknown as ItBlock;
		assert.strictEqual(grandchildSuite1Test3.name, 'Grandchild suite 1 test 3 modifier: no parentModifier: only');
		assert.strictEqual(grandchildSuite1Test3.describeModifier, undefined); // TODO: Is it necessary to have this inside the test type structure?
		assert.ok(grandchildSuite1Test3.filePath.endsWith(COMPLEX_FILE));
		assert.strictEqual(grandchildSuite1Test3.line, 15);
		assert.strictEqual(grandchildSuite1Test3.modifier, null);
		assert.strictEqual(grandchildSuite1Test3.parentModifier, 'only');

		const grandchildSuite1Test4 = grandchildSuiteBlock1.its[3] as unknown as ItBlock;
		assert.strictEqual(grandchildSuite1Test4.name, 'Grandchild suite 1 test 4 modifier: only parentModifier: only');
		assert.strictEqual(grandchildSuite1Test4.describeModifier, undefined); // TODO: Is it necessary to have this inside the test type structure?
		assert.ok(grandchildSuite1Test4.filePath.endsWith(COMPLEX_FILE));
		assert.strictEqual(grandchildSuite1Test4.line, 16);
		assert.strictEqual(grandchildSuite1Test4.modifier, 'only');
		assert.strictEqual(grandchildSuite1Test4.parentModifier, 'only');

		const grandchildSuite1Test5 = grandchildSuiteBlock1.its[4] as unknown as ItBlock;
		assert.strictEqual(grandchildSuite1Test5.name, 'Grandchild suite 1 test 5 modifier: no parentModifier: only');
		assert.strictEqual(grandchildSuite1Test5.describeModifier, undefined); // TODO: Is it necessary to have this inside the test type structure?
		assert.ok(grandchildSuite1Test5.filePath.endsWith(COMPLEX_FILE));
		assert.strictEqual(grandchildSuite1Test5.line, 17);
		assert.strictEqual(grandchildSuite1Test5.modifier, null);
		assert.strictEqual(grandchildSuite1Test5.parentModifier, 'only');

		// grandchild suite 2
		const grandchildSuiteBlock2 = childSuiteBlock.children[1] as unknown as TestBlock;
		assert.strictEqual(grandchildSuiteBlock2.children.length, 0);
		assert.strictEqual(grandchildSuiteBlock2.describe, 'Grandchild suite 2 modifier: skip parentModifier: only');
		assert.ok(grandchildSuiteBlock2.filePath.endsWith(COMPLEX_FILE));
		assert.strictEqual(grandchildSuiteBlock2.its.length, 6);
		assert.strictEqual(grandchildSuiteBlock2.line, 20);
		assert.strictEqual(grandchildSuiteBlock2.modifier, 'skip');
		assert.strictEqual(grandchildSuiteBlock2.parentModifier, 'only');

		// grandchild suite 2 its
		const grandchildSuite2Test1 = grandchildSuiteBlock2.its[0] as unknown as ItBlock;
		assert.strictEqual(grandchildSuite2Test1.name, 'Grandchild suite 2 test 1 modifier: no parentModifier: skip');
		assert.strictEqual(grandchildSuite2Test1.describeModifier, undefined); // TODO: Is it necessary to have this inside the test type structure?
		assert.ok(grandchildSuite2Test1.filePath.endsWith(COMPLEX_FILE));
		assert.strictEqual(grandchildSuite2Test1.line, 21);
		assert.strictEqual(grandchildSuite2Test1.modifier, null);
		assert.strictEqual(grandchildSuite2Test1.parentModifier, 'skip');

		const grandchildSuite2Test2 = grandchildSuiteBlock2.its[1] as unknown as ItBlock;
		assert.strictEqual(grandchildSuite2Test2.name, 'Grandchild suite 2 test 2 modifier: skip parentModifier: skip');
		assert.strictEqual(grandchildSuite2Test2.describeModifier, undefined); // TODO: Is it necessary to have this inside the test type structure?
		assert.ok(grandchildSuite2Test2.filePath.endsWith(COMPLEX_FILE));
		assert.strictEqual(grandchildSuite2Test2.line, 22);
		assert.strictEqual(grandchildSuite2Test2.modifier, 'skip');
		assert.strictEqual(grandchildSuite2Test2.parentModifier, 'skip');

		const grandchildSuite2Test3 = grandchildSuiteBlock2.its[2] as unknown as ItBlock;
		assert.strictEqual(grandchildSuite2Test3.name, 'Grandchild suite 2 test 3 modifier: no parentModifier: skip');
		assert.strictEqual(grandchildSuite2Test3.describeModifier, undefined); // TODO: Is it necessary to have this inside the test type structure?
		assert.ok(grandchildSuite2Test3.filePath.endsWith(COMPLEX_FILE));
		assert.strictEqual(grandchildSuite2Test3.line, 23);
		assert.strictEqual(grandchildSuite2Test3.modifier, null);
		assert.strictEqual(grandchildSuite2Test3.parentModifier, 'skip');

		const grandchildSuite2Test4 = grandchildSuiteBlock2.its[3] as unknown as ItBlock;
		assert.strictEqual(grandchildSuite2Test4.name, 'Grandchild suite 2 test 4 modifier: only parentModifier: skip');
		assert.strictEqual(grandchildSuite2Test4.describeModifier, undefined); // TODO: Is it necessary to have this inside the test type structure?
		assert.ok(grandchildSuite2Test4.filePath.endsWith(COMPLEX_FILE));
		assert.strictEqual(grandchildSuite2Test4.line, 24);
		assert.strictEqual(grandchildSuite2Test4.modifier, 'only');
		assert.strictEqual(grandchildSuite2Test4.parentModifier, 'skip');

		const grandchildSuite2Test5 = grandchildSuiteBlock2.its[4] as unknown as ItBlock;
		assert.strictEqual(grandchildSuite2Test5.name, 'Grandchild suite 2 test 5 modifier: no parentModifier: skip');
		assert.strictEqual(grandchildSuite2Test5.describeModifier, undefined); // TODO: Is it necessary to have this inside the test type structure?
		assert.ok(grandchildSuite2Test5.filePath.endsWith(COMPLEX_FILE));
		assert.strictEqual(grandchildSuite2Test5.line, 25);
		assert.strictEqual(grandchildSuite2Test5.modifier, null);
		assert.strictEqual(grandchildSuite2Test5.parentModifier, 'skip');

		const grandchildSuite2Test6 = grandchildSuiteBlock2.its[5] as unknown as ItBlock;
		assert.strictEqual(grandchildSuite2Test6.name, 'Grandchild suite 2 test 6 modifier: no parentModifier: skip');
		assert.strictEqual(grandchildSuite2Test6.describeModifier, undefined); // TODO: Is it necessary to have this inside the test type structure?
		assert.ok(grandchildSuite2Test6.filePath.endsWith(COMPLEX_FILE));
		assert.strictEqual(grandchildSuite2Test6.line, 26);
		assert.strictEqual(grandchildSuite2Test6.modifier, null);
		assert.strictEqual(grandchildSuite2Test6.parentModifier, 'skip');
	});
});

// TODO: More than one root describe
