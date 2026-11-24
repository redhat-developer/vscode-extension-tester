/**
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { strict as assert } from 'node:assert';
import { buildGrepPattern, escapeRegExp, matchesTitles } from '../../utils/testGrep';

describe('Mocha grep pattern', () => {
	/** Whether Mocha, which matches `grep` against the full title of each test, would run the test. */
	const selects = (pattern: string, fullTitle: string) => new RegExp(pattern).test(fullTitle);

	it('escapes regular expression characters', () => {
		const text = String.raw`a.b*c+d?e^f$g{h}i(j)k|l[m]n\o/p`;
		assert.ok(new RegExp(`^${escapeRegExp(text)}$`).test(text));
	});

	it('selects only the test with the full title', () => {
		const pattern = buildGrepPattern(['Editor', 'opens (a) file'], true);
		assert.ok(selects(pattern, 'Editor opens (a) file'));
		assert.ok(!selects(pattern, 'Editor opens (a) file twice'));
		assert.ok(!selects(pattern, 'Other Editor opens (a) file'));
	});

	it('selects all tests of a describe block, but not a sibling block with a longer name', () => {
		const pattern = buildGrepPattern(['Editor', 'Tabs'], false);
		assert.ok(selects(pattern, 'Editor Tabs closes a tab'));
		assert.ok(selects(pattern, 'Editor Tabs Pinned keeps a tab'));
		assert.ok(!selects(pattern, 'Editor Tabs2 closes a tab'));
		assert.ok(!selects(pattern, 'Editor opens a file'));
	});

	it('matches any text for template literal expressions', () => {
		const pattern = buildGrepPattern(['Version ${version}', 'runs on ${?}'], true);
		assert.ok(selects(pattern, 'Version 1.100.0 runs on linux'));
		assert.ok(!selects(pattern, 'Release 1.100.0 runs on linux'));
	});

	it('matches run-time titles to parsed titles', () => {
		assert.ok(matchesTitles(['Editor (1.2)', 'opens a file'], ['Editor (1.2)', 'opens a file']));
		assert.ok(matchesTitles(['Version ${version}', 'works'], ['Version 1.100.0', 'works']));
		assert.ok(!matchesTitles(['Editor', 'opens a file'], ['Editor', 'opens a file twice']));
		assert.ok(!matchesTitles(['Editor', 'opens a file'], ['Editor']));
	});

	it('matches the suite of a test as a prefix', () => {
		assert.ok(matchesTitles(['Editor', 'Broken', 'never runs'], ['Editor', 'Broken'], true));
		assert.ok(matchesTitles(['Editor', 'opens a file'], [], true));
		assert.ok(!matchesTitles(['Editor', 'opens a file'], ['Other'], true));
	});
});
