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

import { TestBlock, TestRunTarget } from '../types/testTypes';

/**
 * Lists the `describe` blocks and `it` tests of a parsed test file that can be run on their own.
 *
 * @param {TestBlock[]} blocks - The parsed `describe` blocks.
 * @param {string[]} [parentTitles] - The titles of the `describe` blocks that contain the blocks.
 * @returns {TestRunTarget[]} The run targets, each block before its tests and nested blocks.
 */
export function listRunTargets(blocks: TestBlock[], parentTitles: string[] = []): TestRunTarget[] {
	return blocks.flatMap((block) => {
		const titles = [...parentTitles, block.describe];
		const blockTarget: TestRunTarget = {
			file: block.filePath,
			titles,
			isTest: false,
			line: block.line,
			modifier: block.modifier ?? undefined,
			inheritedModifier: block.parentModifier ?? undefined,
		};
		const tests = block.its.map((it): TestRunTarget => ({
			file: it.filePath,
			titles: [...titles, it.name],
			isTest: true,
			line: it.line,
			modifier: it.modifier ?? undefined,
			inheritedModifier: it.parentModifier ?? it.describeModifier ?? undefined,
		}));
		return [blockTarget, ...tests, ...listRunTargets(block.children, titles)];
	});
}
