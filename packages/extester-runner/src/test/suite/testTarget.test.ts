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
import * as path from 'path';
import { getAllTarget, getFileTarget, getFolderTarget, getTestTargetSettings, TestTargetSettings } from '../../tasks/testTarget';

describe('Test target paths', () => {
	const workspace = path.resolve('/workspace');
	const at = (...segments: string[]) => path.join(workspace, ...segments);

	const compiled: TestTargetSettings = {
		runSources: false,
		outputFolder: 'out',
		rootFolder: 'src',
		testFileGlob: '**/ui-test/**/*.test.ts',
	};
	const sources: TestTargetSettings = { ...compiled, runSources: true };

	describe('compiled JavaScript (runSources off)', () => {
		it('maps a file to the output folder without the root folder', () => {
			assert.strictEqual(getFileTarget(at('src', 'ui-test', 'a.test.ts'), workspace, compiled), at('out', 'ui-test', 'a.test.js'));
		});

		it('keeps the whole relative path when no root folder is set', () => {
			const settings = { ...compiled, rootFolder: undefined };
			assert.strictEqual(getFileTarget(at('src', 'ui-test', 'a.test.ts'), workspace, settings), at('out', 'src', 'ui-test', 'a.test.js'));
		});

		it('maps a folder to a glob of the compiled files in it', () => {
			assert.strictEqual(getFolderTarget(at('src', 'ui-test'), workspace, compiled), at('out', 'ui-test', '*.test.js'));
		});

		it('maps all files to a glob below their common folder', () => {
			const files = [at('src', 'ui-test', 'a', 'a.test.ts'), at('src', 'ui-test', 'b', 'b.test.ts')];
			assert.strictEqual(getAllTarget(files, workspace, compiled), at('out', 'ui-test', '**', '*.test.js'));
		});

		it('uses the folder of a single test file for Run All', () => {
			const files = [at('src', 'ui-test', 'a.test.ts')];
			assert.strictEqual(getAllTarget(files, workspace, compiled), at('out', 'ui-test', '**', '*.test.js'));
		});
	});

	describe('TypeScript sources (runSources on)', () => {
		it('passes a file as it is', () => {
			assert.strictEqual(getFileTarget(at('src', 'ui-test', 'a.test.ts'), workspace, sources), at('src', 'ui-test', 'a.test.ts'));
		});

		it('passes a glob of the source files in a folder', () => {
			assert.strictEqual(getFolderTarget(at('src', 'ui-test'), workspace, sources), at('src', 'ui-test', '*.test.ts'));
		});

		it('passes a glob of all source files below their common folder', () => {
			const files = [at('src', 'ui-test', 'a', 'a.test.ts'), at('src', 'ui-test', 'b', 'b.test.ts')];
			assert.strictEqual(getAllTarget(files, workspace, sources), at('src', 'ui-test', '**', '*.test.ts'));
		});

		it('ignores the output and root folders', () => {
			const settings: TestTargetSettings = {
				runSources: true,
				outputFolder: 'packages/ui-tests-vscode/out',
				rootFolder: 'packages/ui-tests-vscode/src',
				testFileGlob: 'packages/ui-tests-vscode/src/**/*.test.ts',
			};
			const file = at('packages', 'ui-tests-vscode', 'src', 'editor', 'BasicFlow.test.ts');
			const other = at('packages', 'ui-tests-vscode', 'src', 'views', 'Views.test.ts');
			assert.strictEqual(getFileTarget(file, workspace, settings), file);
			assert.strictEqual(getFolderTarget(path.dirname(file), workspace, settings), at('packages', 'ui-tests-vscode', 'src', 'editor', '*.test.ts'));
			assert.strictEqual(getAllTarget([file, other], workspace, settings), at('packages', 'ui-tests-vscode', 'src', '**', '*.test.ts'));
		});
	});

	describe('getTestTargetSettings', () => {
		const reader = (values: Record<string, unknown>) => ({ get: <T>(key: string) => values[key] as T | undefined });

		it('applies the defaults of package.json', () => {
			assert.deepStrictEqual(getTestTargetSettings(reader({})), {
				runSources: false,
				outputFolder: 'out',
				rootFolder: undefined,
				testFileGlob: '**/ui-test/**/*.test.ts',
			});
		});

		it('reads runSources', () => {
			assert.strictEqual(getTestTargetSettings(reader({ runSources: true })).runSources, true);
		});
	});
});
