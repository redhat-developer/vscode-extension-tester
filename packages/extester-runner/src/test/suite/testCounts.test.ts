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
import { TestBlock } from '../../types/testTypes';
import { countTests, FOCUSED_TEST_PATTERN, pluralize } from '../../utils/testCounts';

describe('Test counts and labels', () => {
	const itBlock = (name: string) => ({ name, filePath: '/a.test.ts', line: 1 });
	const block = (describe: string, its: string[], children: TestBlock[] = []): TestBlock => ({
		describe,
		filePath: '/a.test.ts',
		line: 1,
		its: its.map(itBlock),
		children,
	});

	describe('pluralize', () => {
		it('uses the singular for one item', () => {
			assert.strictEqual(pluralize(1, 'test'), '1 test');
		});

		it('uses the plural for zero and several items', () => {
			assert.strictEqual(pluralize(0, 'test'), '0 tests');
			assert.strictEqual(pluralize(3, 'file'), '3 files');
		});
	});

	describe('countTests', () => {
		it('counts no tests in an empty file', () => {
			assert.strictEqual(countTests([]), 0);
		});

		it('counts tests in nested describe blocks', () => {
			const blocks = [block('root 1', ['a', 'b'], [block('nested', ['c'], [block('deep', ['d', 'e'])])]), block('root 2', ['f'])];
			assert.strictEqual(countTests(blocks), 6);
		});
	});

	describe('focused test pattern', () => {
		for (const source of ["describe.only('suite', () => {})", "it.only('test', async () => {})", 'context.only ("x", fn)', "test.only('x')"]) {
			it(`matches ${source}`, () => {
				assert.ok(FOCUSED_TEST_PATTERN.test(source));
			});
		}

		for (const source of ["describe('suite', () => {})", "it.skip('test')", 'const only = items.only;', "myit.only('x')"]) {
			it(`does not match ${source}`, () => {
				assert.ok(!FOCUSED_TEST_PATTERN.test(source));
			});
		}
	});
});
