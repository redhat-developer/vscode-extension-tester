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

import { TestBlock } from '../types/testTypes';

/**
 * Matches a focused Mocha block, for example `describe.only(` or `it.only(`.
 */
export const FOCUSED_TEST_PATTERN = /\b(?:describe|context|suite|it|specify|test)\.only\s*\(/;

/**
 * Returns `count` with the singular or plural form of `noun`, for example "1 test" or "3 tests".
 *
 * @param {number} count - The number of items.
 * @param {string} noun - The singular noun.
 * @returns {string} The count and noun.
 */
export function pluralize(count: number, noun: string): string {
	return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

/**
 * Counts the `it` blocks in parsed test blocks, including nested `describe` blocks.
 *
 * @param {TestBlock[]} blocks - Parsed test blocks.
 * @returns {number} The number of tests.
 */
export function countTests(blocks: TestBlock[]): number {
	return blocks.reduce((count, block) => count + block.its.length + countTests(block.children), 0);
}
