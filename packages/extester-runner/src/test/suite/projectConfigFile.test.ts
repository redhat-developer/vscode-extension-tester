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
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readProjectConfiguration, resolveConfiguration } from '../../utils/projectConfigFile';

describe('Project configuration file', () => {
	let root: string;
	beforeEach(() => {
		root = mkdtempSync(join(tmpdir(), 'extester-config-'));
	});
	afterEach(() => {
		rmSync(root, { recursive: true, force: true });
	});
	const fallback = {
		get: <T>(key: string) =>
			({ outputFolder: 'old', rootFolder: 'src', hideEmptyLogFolders: true, additionalArgs: ['--offline'] })[key as 'outputFolder'] as T | undefined,
	};
	function write(value: unknown) {
		writeFileSync(join(root, '.extester.json'), JSON.stringify(value));
	}

	it('keeps existing settings when no file exists', () => {
		const config = resolveConfiguration(readProjectConfiguration(root), fallback);
		assert.equal(config.get('outputFolder'), 'old');
		assert.equal(config.get('unknown', 'default'), 'default');
	});
	it('overrides only explicit file values, including false, empty strings and arrays', () => {
		write({ outputFolder: 'compiled', hideEmptyLogFolders: false, additionalArgs: [], ignorePathPart: '' });
		const config = resolveConfiguration(readProjectConfiguration(root), fallback);
		assert.equal(config.get('outputFolder'), 'compiled');
		assert.equal(config.get('rootFolder'), 'src');
		assert.equal(config.get('hideEmptyLogFolders'), false);
		assert.deepEqual(config.get('additionalArgs'), []);
		assert.equal(config.get('ignorePathPart', 'hidden'), '');
	});
	it('reads nested VS Code settings and the CLI configuration reference', () => {
		write({ visualStudioCode: { Version: 'min', Type: 'insider' }, configFile: 'packages/tests/extester.config.json' });
		const config = resolveConfiguration(readProjectConfiguration(root), fallback);
		assert.equal(config.get('visualStudioCode.Version'), 'min');
		assert.equal(config.get('visualStudioCode.Type'), 'insider');
		assert.equal(config.get('configFile'), 'packages/tests/extester.config.json');
	});
	it('keeps project roots isolated and reads edits and deletion without stale values', () => {
		write({ outputFolder: 'first' });
		assert.equal(readProjectConfiguration(root).outputFolder, 'first');
		const other = join(root, 'other');
		assert.deepEqual(readProjectConfiguration(other), {});
		write({ outputFolder: 'second' });
		assert.equal(readProjectConfiguration(root).outputFolder, 'second');
		rmSync(join(root, '.extester.json'));
		assert.deepEqual(readProjectConfiguration(root), {});
	});
	it('reports malformed JSON with the config filename', () => {
		writeFileSync(join(root, '.extester.json'), '{');
		assert.throws(() => readProjectConfiguration(root), /\.extester\.json/);
	});
	for (const value of [
		null,
		[],
		{ outputFolder: 42 },
		{ additionalArgs: ['--offline', true] },
		{ hideEmptyLogFolders: 'false' },
		{ visualStudioCode: { Type: 'invalid' } },
		{ visualStudioCode: { version: 'min' } },
		{ typo: true },
		{ configFile: '' },
	]) {
		it(`rejects invalid configuration ${JSON.stringify(value)}`, () => {
			write(value);
			assert.throws(() => readProjectConfiguration(root), /\.extester\.json/);
		});
	}
});
