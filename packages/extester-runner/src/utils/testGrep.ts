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
 * Matches a placeholder that the parser writes for an expression in a template literal title,
 * for example `${variable}` or `${?}`.
 */
const PLACEHOLDER_PATTERN = /\$\{[^}]*\}/g;

/**
 * Escapes a text so it matches itself in a regular expression.
 *
 * @param {string} text - The text to escape.
 * @returns {string} The escaped text.
 */
export function escapeRegExp(text: string): string {
	return text.replaceAll(/[.*+?^${}()|[\]\\/]/g, String.raw`\$&`);
}

/**
 * Builds the Mocha `grep` pattern that selects one `describe` block or one `it` test.
 *
 * Mocha matches `grep` against the full title of each test: the titles of its `describe` blocks
 * and its own title, joined by spaces. The pattern is anchored at the start, so a block with the
 * same name in another suite is not selected. A test is also anchored at the end. A `describe`
 * block is followed by a space instead, so all of its tests match but a sibling block whose name
 * starts with the same text does not. Template literal expressions in titles, which are only
 * known at run time, match any text.
 *
 * @param {string[]} titles - The titles from the outermost `describe` block to the selected block.
 * @param {boolean} isTest - Whether the selected block is an `it` test.
 * @returns {string} The `grep` pattern.
 */
export function buildGrepPattern(titles: string[], isTest: boolean): string {
	const fullTitle = titles
		.map((title) =>
			title
				.split(PLACEHOLDER_PATTERN)
				.map((part) => escapeRegExp(part))
				.join('.*'),
		)
		.join(' ');
	return `^${fullTitle}${isTest ? '$' : ' '}`;
}
