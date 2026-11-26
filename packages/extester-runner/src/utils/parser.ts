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

import * as vscode from 'vscode';
import { parse } from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { Logger } from '../logger/logger';
import { TestBlock } from '../types/testTypes';

/**
 * What a function of a Mocha interface defines, and the modifier the function itself stands for,
 * such as `skip` for `xit`.
 */
interface InterfaceFunction {
	kind: 'suite' | 'test';
	modifier?: string;
	/**
	 * Whether a call defines a suite only when it passes its callback in place. A QUnit `suite` has the
	 * same name as a TDD `suite` but no callback, and its tests do not run inside it.
	 */
	needsCallback?: boolean;
}

/**
 * A Mocha interface: the functions that define its suites and tests.
 */
interface MochaInterface {
	name: string;
	functions: Map<string, InterfaceFunction>;
}

/**
 * The supported Mocha interfaces, in the order a file is checked for them.
 */
const INTERFACES: MochaInterface[] = [
	{
		name: 'BDD',
		functions: new Map<string, InterfaceFunction>([
			['describe', { kind: 'suite' }],
			['context', { kind: 'suite' }],
			['xdescribe', { kind: 'suite', modifier: 'skip' }],
			['xcontext', { kind: 'suite', modifier: 'skip' }],
			['it', { kind: 'test' }],
			['specify', { kind: 'test' }],
			['xit', { kind: 'test', modifier: 'skip' }],
			['xspecify', { kind: 'test', modifier: 'skip' }],
		]),
	},
	{
		name: 'TDD',
		functions: new Map<string, InterfaceFunction>([
			['suite', { kind: 'suite', needsCallback: true }],
			['test', { kind: 'test' }],
		]),
	},
];

/** The variants of the suite and test functions, such as `describe.only` and `test.skip`. */
const MODIFIERS = new Set(['only', 'skip']);

/**
 * Parses a test file and extracts its structure.
 *
 * This function analyzes TypeScript test files using Babel's AST parser, without running them,
 * and constructs a hierarchical representation of their suites and tests to be used in a test
 * explorer or similar UI. It reads two of Mocha's interfaces:
 *
 * - BDD: `describe` or `context` suites and `it` or `specify` tests, with `.only` and `.skip`,
 *   and `xdescribe`, `xcontext`, `xit` and `xspecify`, which skip.
 * - TDD: `suite` and `test`, with `.only` and `.skip`.
 *
 * Only Mocha's functions count: the globals that Mocha's `ui` option defines, and functions
 * imported from `mocha`. A function or variable that the file declares itself, or imports from
 * another module, does not add suites or tests, even when it has the name of a Mocha function.
 *
 * Mocha's `ui` option applies to a whole run, so a file uses one interface. The parser reads the
 * file as BDD when it calls a BDD function, and as TDD otherwise.
 *
 * @param {vscode.Uri} uri - The URI of the file to be parsed.
 * @param {Logger} logger - The logging utility for debugging and tracking parsing operations.
 * @returns {Promise<TestBlock[]>} - The suites at the top level of the file, with their tests and nested suites.
 */
export async function parseTestFile(uri: vscode.Uri, logger: Logger): Promise<TestBlock[]> {
	const document = await vscode.workspace.openTextDocument(uri);
	const content = document.getText();

	// Parse the file into an abstract syntax tree (AST).
	const ast = parse(content, {
		sourceType: 'module',
		plugins: ['typescript'], // handle TypeScript-specific syntax
	});

	const mochaInterface = detectInterface(ast);
	const interfaceText = mochaInterface ? ' (' + mochaInterface.name + ' interface)' : '';
	logger.debug(`Parsing file: ${uri}${interfaceText}`);
	return mochaInterface ? parseSuites(ast, uri.fsPath, mochaInterface) : [];
}

/**
 * The interface of a file: the first of the supported interfaces whose suite or test functions it calls.
 *
 * @param {t.File} ast - The parsed file.
 * @returns {MochaInterface | undefined} The interface, or `undefined` when the file calls no suite or test function.
 */
function detectInterface(ast: t.File): MochaInterface | undefined {
	const used = new Set<MochaInterface>();
	traverse(ast, {
		CallExpression(path) {
			INTERFACES.filter((candidate) => resolveCall(path, candidate)).forEach((candidate) => used.add(candidate));
		},
	});
	return INTERFACES.find((candidate) => used.has(candidate));
}

/**
 * The suite or test function of an interface that a call calls, such as `describe(...)`,
 * `it.only(...)` or `xit(...)`, with the modifier of the call.
 *
 * @param {NodePath<t.CallExpression>} path - The call.
 * @param {MochaInterface} mochaInterface - The interface.
 * @returns {InterfaceFunction | undefined} The function, or `undefined` when the call calls none of the interface.
 */
function resolveCall(path: NodePath<t.CallExpression>, mochaInterface: MochaInterface): InterfaceFunction | undefined {
	const callee = path.node.callee;
	const lookUp = (name: string) => {
		const mocha = mochaName(path, name);
		return mocha === undefined ? undefined : mochaInterface.functions.get(mocha);
	};
	let called: InterfaceFunction | undefined;
	if (t.isIdentifier(callee)) {
		called = lookUp(callee.name);
	} else if (
		t.isMemberExpression(callee) &&
		!callee.computed &&
		t.isIdentifier(callee.object) &&
		t.isIdentifier(callee.property) &&
		MODIFIERS.has(callee.property.name)
	) {
		const variantOf = lookUp(callee.object.name);
		// `xit` and the other skipping functions have no `.only` or `.skip`.
		called = variantOf && !variantOf.modifier ? { ...variantOf, modifier: callee.property.name } : undefined;
	}
	if (called?.needsCallback && !path.node.arguments.some((arg) => t.isFunctionExpression(arg) || t.isArrowFunctionExpression(arg))) {
		return undefined;
	}
	return called;
}

/**
 * The name of the Mocha function that a name in a file stands for: the name itself when the file
 * does not declare it, as for the globals that Mocha defines, or the imported name when the file
 * imports it from `mocha`, as in `import { suite as group } from 'mocha'` or
 * `const { suite } = require('mocha')`.
 *
 * @param {NodePath} path - Where the name is used.
 * @param {string} name - The name.
 * @returns {string | undefined} The Mocha name, or `undefined` when the file declares the name itself or imports it from another module.
 */
function mochaName(path: NodePath, name: string): string | undefined {
	const binding = path.scope.getBinding(name);
	if (!binding) {
		return name;
	}
	const declaration = binding.path;
	if (declaration.isImportSpecifier() && t.isImportDeclaration(declaration.parent) && declaration.parent.source.value === 'mocha') {
		const imported = declaration.node.imported;
		return t.isIdentifier(imported) ? imported.name : imported.value;
	}
	if (declaration.isVariableDeclarator() && isRequireOfMocha(declaration.node.init) && t.isObjectPattern(declaration.node.id)) {
		const property = declaration.node.id.properties.find((candidate) => t.isObjectProperty(candidate) && t.isIdentifier(candidate.value, { name }));
		if (t.isObjectProperty(property) && !property.computed && t.isIdentifier(property.key)) {
			return property.key.name;
		}
	}
	return undefined;
}

/** Whether an expression is `require('mocha')`. */
function isRequireOfMocha(expression: t.Expression | null | undefined): boolean {
	return (
		t.isCallExpression(expression) &&
		t.isIdentifier(expression.callee, { name: 'require' }) &&
		t.isStringLiteral(expression.arguments[0], { value: 'mocha' })
	);
}

/**
 * The modifier that a suite passes on to its tests and nested suites.
 */
function inheritedModifier(suite: TestBlock | undefined): string | null | undefined {
	return suite?.modifier ?? suite?.parentModifier;
}

/**
 * Reads the suites and tests of a file. The tests and nested suites of a suite are the calls in its callback.
 *
 * @param {t.File} ast - The parsed file.
 * @param {string} filePath - The path of the file.
 * @param {MochaInterface} mochaInterface - The interface the file uses.
 * @returns {TestBlock[]} The suites at the top level of the file.
 */
function parseSuites(ast: t.File, filePath: string, mochaInterface: MochaInterface): TestBlock[] {
	const testStructure: TestBlock[] = []; // root structure
	const stack: TestBlock[] = []; // suites whose callback is being read, innermost last
	const opened = new WeakSet<t.CallExpression>(); // calls that pushed a suite onto the stack

	traverse(ast, {
		CallExpression: {
			enter(path) {
				const called = resolveCall(path, mochaInterface);
				if (!called) {
					return;
				}
				const titleArg = path.node.arguments[0];
				const line = path.node.loc?.start.line ?? 0;
				const modifier = called.modifier ?? null;
				const parent = stack.at(-1);

				if (called.kind === 'test') {
					// A test outside any suite runs in Mocha's root suite; such tests are not listed.
					parent?.its.push({
						name: extractTestName(titleArg, 'Unnamed Test'),
						filePath,
						line,
						modifier,
						parentModifier: inheritedModifier(parent),
					});
					return;
				}

				const suite: TestBlock = {
					describe: extractTestName(titleArg, 'Unnamed Suite'),
					filePath,
					line,
					its: [],
					children: [],
					modifier,
					parentModifier: inheritedModifier(parent),
				};
				(parent?.children ?? testStructure).push(suite);
				stack.push(suite);
				opened.add(path.node);
			},
			exit(path) {
				if (opened.has(path.node)) {
					stack.pop(); // the callback of the suite ends here
				}
			},
		},
	});
	return testStructure;
}

/**
 * Extracts the test name from a node in the AST.
 *
 * This function handles different node types, such as string literals and template literals,
 * and attempts to resolve meaningful test names.
 *
 * @param {t.Node | undefined} node - The AST node containing the test name.
 * @param {string} defaultName - The default name to use if extraction fails.
 * @returns {string} - The extracted test name or the default name if extraction fails.
 */
function extractTestName(node: t.Node | undefined, defaultName: string): string {
	if (t.isStringLiteral(node)) {
		return node.value; // regular string
	} else if (t.isTemplateLiteral(node)) {
		return node.quasis
			.map((q, i) => {
				let text = q.value.cooked ?? ''; // static text
				if (node.expressions[i]) {
					const expr = node.expressions[i];

					// If the expression is an identifier (a variable like "foo"), keep its name.
					if (t.isIdentifier(expr)) {
						text += `\${${expr.name}}`;
					} else {
						text += '${?}'; // Unknown expressions get a placeholder.
					}
				}
				return text;
			})
			.join('');
	}
	return defaultName; // Fallback if no valid name is found.
}
