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
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { Logger } from '../logger/logger';
import { TestBlock } from '../types/testTypes';

/**
 * Parses a test file and extracts its structure.
 *
 * This function analyzes TypeScript test files using Babel's AST parser and identifies
 * `describe` and `it` blocks. It constructs a hierarchical representation of the test structure
 * to be used in a test explorer or similar UI.
 *
 * @param {vscode.Uri} uri - The URI of the file to be parsed.
 * @param {Logger} logger - The logging utility for debugging and tracking parsing operations.
 * @returns {Promise<TestBlock[]>} - A structured representation of the test file.
 */
export async function parseTestFile(uri: vscode.Uri, logger: Logger): Promise<TestBlock[]> {
	const document = await vscode.workspace.openTextDocument(uri);
	const content = document.getText();

	// Parse the file into an abstract syntax tree (AST).
	const ast = parse(content, {
		sourceType: 'module',
		plugins: ['typescript'], // handle TypeScript-specific syntax
	});

	const testStructure: TestBlock[] = []; // root structure
	const stack: TestBlock[] = []; // stack for managing nesting

	logger.debug(`Parsing file: ${uri}`);

	traverse(ast, {
		/**
		 * Handles function calls in the AST to detect test blocks.
		 * Identifies `describe` and `it` blocks, extracts their names,
		 * and organizes them into a structured hierarchy.
		 */
		CallExpression(path) {
			const callee = path.node.callee;
			let functionName: string | undefined = undefined;
			let modifier: string | null = null;

			// identify function name and modifier (e.g., `describe`, `it.skip`)
			if (t.isIdentifier(callee)) {
				functionName = callee.name;
			} else if (t.isMemberExpression(callee)) {
				const object = callee.object;
				const property = callee.property;
				if (t.isIdentifier(object) && t.isIdentifier(property)) {
					functionName = object.name;
					modifier = property.name; // handle `.skip`, `.only`
				}
			}

			// get line of occurrence
			const line = path.node.loc?.start.line || 0;

			// handle `describe` blocks
			if (functionName === 'describe') {
				const firstArg = path.node.arguments[0];
				const describeName = extractTestName(t.isExpression(firstArg) ? firstArg : undefined, 'Unnamed Describe', logger);

				const lastElement = stack.length > 0 ? stack[stack.length - 1] : null;
				let parentDescribeModifier = lastElement?.modifier ?? lastElement?.parentModifier;

				const newDescribeBlock: TestBlock = {
					describe: describeName,
					filePath: uri.fsPath,
					line: line,
					its: [],
					children: [],
					modifier: modifier,
					parentModifier: parentDescribeModifier,
				};

				// add to parent block's children or root structure
				if (stack.length > 0) {
					const parent = stack[stack.length - 1];
					parent.children.push(newDescribeBlock);
				} else {
					testStructure.push(newDescribeBlock);
				}

				stack.push(newDescribeBlock);
				return;
			}

			// handle `it` blocks
			if (functionName === 'it') {
				const itArg = path.node.arguments[0];
				const itName = extractTestName(t.isExpression(itArg) ? itArg : undefined, 'Unnamed It', logger);

				const lastElement = stack.length > 0 ? stack[stack.length - 1] : null;
				let parentDescribeModifier = lastElement?.modifier ?? lastElement?.parentModifier;

				const itBlock = {
					name: itName,
					filePath: uri.fsPath,
					modifier: modifier,
					parentModifier: parentDescribeModifier,
					line: line,
				};

				// add to the `its` array of the current `describe` block
				if (stack.length > 0) {
					const currentDescribe = stack[stack.length - 1];
					currentDescribe.its.push(itBlock);
				}
			}
		},

		/**
		 * Handles exit conditions for `describe` blocks.
		 * Ensures that nested test structures are properly closed when the parser
		 * finishes processing a `describe` block.
		 */
		exit(path) {
			if (path.isCallExpression()) {
				const callee = path.node.callee;
				let functionName: string | undefined = undefined;

				if (t.isIdentifier(callee)) {
					functionName = callee.name;
				} else if (t.isMemberExpression(callee)) {
					const object = callee.object;
					if (t.isIdentifier(object)) {
						functionName = object.name;
					}
				}

				if (functionName === 'describe') {
					stack.pop(); // pop the current `describe` block from the stack
				}
			}
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
 * @param {t.Expression | undefined} node - The AST node containing the test name.
 * @param {string} defaultName - The default name to use if extraction fails.
 * @param {Logger} logger - The logging utility for debugging.
 * @returns {string} - The extracted test name or the default name if extraction fails.
 */
function extractTestName(node: t.Expression | undefined, defaultName: string, logger: Logger): string {
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
