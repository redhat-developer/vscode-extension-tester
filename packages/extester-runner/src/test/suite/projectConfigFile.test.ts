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
import { mkdtempSync, writeFileSync, rmSync, mkdirSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { readProjectConfiguration, resolveConfiguration } from '../../utils/projectConfigFile';

describe('Project configuration file', () => {
	let root: string;
	beforeEach(() => {
		root = realpathSync(mkdtempSync(join(tmpdir(), 'extester-config-')));
	});
	afterEach(() => {
		rmSync(root, { recursive: true, force: true });
	});
	type Scopes = { defaultValue?: unknown; globalValue?: unknown; workspaceValue?: unknown; workspaceFolderValue?: unknown };
	function settings(values: Record<string, Scopes>) {
		return { inspect: <T>(key: string) => values[key] as { defaultValue?: T; globalValue?: T; workspaceValue?: T; workspaceFolderValue?: T } | undefined };
	}
	const fallback = settings({
		outputFolder: { defaultValue: 'out', globalValue: 'old' },
		rootFolder: { globalValue: 'src' },
		runSources: { defaultValue: false },
		additionalArgs: { globalValue: ['--offline'] },
		'visualStudioCode.Version': { defaultValue: 'max' },
	});
	function write(value: unknown, file = 'extester.config.json') {
		mkdirSync(dirname(join(root, file)), { recursive: true });
		writeFileSync(join(root, file), JSON.stringify(value));
	}

	it('keeps existing settings when no file exists', () => {
		const config = resolveConfiguration(readProjectConfiguration(root), fallback);
		assert.equal(config.get('outputFolder'), 'old');
		assert.equal(config.get('unknown', 'default'), 'default');
	});
	it('reads the runner section with paths relative to the workspace root', () => {
		write({
			runner: {
				testFileGlob: 'packages/ui-tests/src/**/*.test.ts',
				excludeGlob: '**/node_modules/**',
				ignorePathPart: 'packages/ui-tests/',
				rootFolder: 'packages/ui-tests/src',
				outputFolder: 'packages/ui-tests/out',
				runSources: true,
				additionalArgs: ['--log_level Debug'],
				env: { TEST_USER: 'tester' },
				preRunTask: 'npm: compile',
				runCommand: 'npm run ui-test -- ${target}',
			},
		});
		assert.deepEqual(readProjectConfiguration(root), {
			testFileGlob: 'packages/ui-tests/src/**/*.test.ts',
			excludeGlob: '**/node_modules/**',
			ignorePathPart: 'packages/ui-tests',
			rootFolder: 'packages/ui-tests/src',
			outputFolder: 'packages/ui-tests/out',
			runSources: true,
			additionalArgs: ['--log_level Debug'],
			env: { TEST_USER: 'tester' },
			preRunTask: 'npm: compile',
			runCommand: 'npm run ui-test -- ${target}',
		});
	});
	it('reads the VS Code version, type and storage folder from setup before run', () => {
		write({ setup: { vscodeVersion: 'min', storage: 'setup-resources' }, run: { vscodeVersion: 'max', type: 'insider', storage: 'run-resources' } });
		assert.deepEqual(readProjectConfiguration(root), {
			'visualStudioCode.Version': 'min',
			'visualStudioCode.Type': 'insider',
			tempFolder: join(root, 'setup-resources'),
		});
	});
	it('overrides only explicit file values, including false, empty strings and arrays', () => {
		write({ runner: { outputFolder: 'compiled', runSources: false, additionalArgs: [] } });
		const config = resolveConfiguration(readProjectConfiguration(root), fallback);
		assert.equal(config.get('outputFolder'), 'compiled');
		assert.equal(config.get('rootFolder'), 'src');
		assert.equal(config.get('runSources'), false);
		assert.deepEqual(config.get('additionalArgs'), []);
	});
	it('resolves paths of a file in a subfolder against that file', () => {
		write({ runner: { testFileGlob: 'src/**/*.test.ts', rootFolder: 'src', outputFolder: 'out' } }, 'packages/ui-tests/extester.config.json');
		assert.deepEqual(readProjectConfiguration(root, 'packages/ui-tests/extester.config.json'), {
			testFileGlob: 'packages/ui-tests/src/**/*.test.ts',
			rootFolder: 'packages/ui-tests/src',
			outputFolder: 'packages/ui-tests/out',
		});
	});
	it('inherits values from extended base files', () => {
		write({ runner: { rootFolder: 'src' }, setup: { vscodeVersion: 'min' } }, 'base/extester.base.json');
		write({ extends: './base/extester.base.json', runner: { outputFolder: 'out' } });
		const project = readProjectConfiguration(root);
		assert.equal(project.rootFolder, 'base/src');
		assert.equal(project.outputFolder, 'out');
		assert.equal(project['visualStudioCode.Version'], 'min');
	});
	it('lets workspace and workspace-folder settings override the project file and reports it', () => {
		write({ runner: { outputFolder: 'compiled', rootFolder: 'project-src' }, setup: { vscodeVersion: 'min' } });
		const shadowed: string[] = [];
		const config = resolveConfiguration(
			readProjectConfiguration(root),
			settings({
				outputFolder: { globalValue: 'global', workspaceValue: 'local' },
				rootFolder: { workspaceValue: 'workspace', workspaceFolderValue: 'folder' },
				'visualStudioCode.Version': { defaultValue: 'max', globalValue: '1.100.0' },
				ignorePathPart: { workspaceValue: 'only-local/' },
			}),
			(key) => shadowed.push(key),
		);
		assert.equal(config.get('outputFolder'), 'local');
		assert.equal(config.get('rootFolder'), 'folder');
		assert.equal(config.get('visualStudioCode.Version'), 'min');
		assert.equal(config.get('ignorePathPart'), 'only-local/');
		assert.deepEqual(shadowed, ['outputFolder', 'rootFolder']);
	});
	it('tells which values come from the project file', () => {
		write({ runner: { outputFolder: 'compiled', rootFolder: 'project-src' }, setup: { vscodeVersion: 'min' } });
		const config = resolveConfiguration(
			readProjectConfiguration(root),
			settings({ rootFolder: { workspaceValue: 'local' }, 'visualStudioCode.Type': { defaultValue: 'stable' } }),
		);
		assert.equal(config.isFromConfigFile?.('outputFolder'), true);
		assert.equal(config.isFromConfigFile?.('visualStudioCode.Version'), true);
		assert.equal(config.isFromConfigFile?.('rootFolder'), false);
		assert.equal(config.isFromConfigFile?.('visualStudioCode.Type'), false);
	});
	it('falls back to user settings, then defaults, for values missing from the project file', () => {
		write({ runner: { rootFolder: 'project-src' } });
		const config = resolveConfiguration(readProjectConfiguration(root), fallback);
		assert.equal(config.get('rootFolder'), 'project-src');
		assert.equal(config.get('outputFolder'), 'old');
		assert.equal(config.get('runSources'), false);
		assert.equal(config.get('visualStudioCode.Version'), 'max');
	});
	it('keeps project roots isolated and reads edits and deletion without stale values', () => {
		write({ runner: { outputFolder: 'first' } });
		assert.equal(readProjectConfiguration(root).outputFolder, 'first');
		const other = join(root, 'other');
		assert.deepEqual(readProjectConfiguration(other), {});
		write({ runner: { outputFolder: 'second' } });
		assert.equal(readProjectConfiguration(root).outputFolder, 'second');
		rmSync(join(root, 'extester.config.json'));
		assert.deepEqual(readProjectConfiguration(root), {});
	});
	it('reports malformed JSON with the config filename', () => {
		writeFileSync(join(root, 'extester.config.json'), '{');
		assert.throws(() => readProjectConfiguration(root), /extester\.config\.json/);
	});
	it('reports a missing configFile', () => {
		assert.throws(() => readProjectConfiguration(root, 'missing/extester.config.json'), /missing.*not found/);
	});
	it('rejects a configFile outside the workspace folder', () => {
		assert.throws(() => readProjectConfiguration(root, '../extester.config.json'), /inside the workspace folder/);
	});
	for (const value of [
		{ runner: [] },
		{ runner: { outputFolder: 42 } },
		{ runner: { additionalArgs: ['--offline', true] } },
		{ runner: { runSources: 'true' } },
		{ runner: { env: { PORT: 8080 } } },
		{ runner: { env: ['TEST_USER=tester'] } },
		{ runner: { preRunTask: ['npm: compile'] } },
		{ runner: { runCommand: ['npm', 'test'] } },
		{ runner: { tempFolder: 'tmp' } },
		{ runner: { typo: true } },
		{ runner: { outputFolder: '../outside' } },
		{ runner: { testFileGlob: '../outside/**/*.test.ts' } },
	]) {
		it(`rejects invalid configuration ${JSON.stringify(value)}`, () => {
			write(value);
			assert.throws(() => readProjectConfiguration(root), /extester\.config\.json/);
		});
	}
});
