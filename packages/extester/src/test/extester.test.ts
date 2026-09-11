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

import assert from 'assert';
import * as fs from 'fs-extra';
import * as os from 'os';
import * as path from 'path';
import { resolveVsixPath } from '../extester';

describe('resolveVsixPath', () => {
	let tmpDir: string;

	beforeEach(() => {
		// Create a temp dir with a minimal package.json so require() resolves it
		tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'extester-test-'));
		fs.writeJsonSync(path.join(tmpDir, 'package.json'), { name: 'my-ext', version: '1.2.3' });
	});

	afterEach(() => {
		fs.removeSync(tmpDir);
	});

	it('uses the default <name>-<version>.vsix under cwd when no packagePath is set', () => {
		const result = resolveVsixPath({ cwd: tmpDir });
		assert.strictEqual(result, path.join(tmpDir, 'my-ext-1.2.3.vsix'));
	});

	it('uses process.cwd() when neither cwd nor packagePath is set', () => {
		// Resolve against the current working directory (project root during tests).
		// The manifest under process.cwd() is the extester package.json.
		const result = resolveVsixPath({});
		const manifest = require(path.resolve(process.cwd(), 'package.json')) as { name: string; version: string };
		const expected = path.resolve(process.cwd(), `${manifest.name}-${manifest.version}.vsix`);
		assert.strictEqual(result, expected);
	});

	it('treats packagePath ending in .vsix as a direct file path', () => {
		const result = resolveVsixPath({ cwd: tmpDir, packagePath: 'kaoto-2.12.0-dev.vsix' });
		assert.strictEqual(result, path.join(tmpDir, 'kaoto-2.12.0-dev.vsix'));
	});

	it('treats an absolute packagePath ending in .vsix as absolute', () => {
		const abs = path.join(tmpDir, 'dist', 'my-ext-1.2.3.vsix');
		const result = resolveVsixPath({ cwd: tmpDir, packagePath: abs });
		assert.strictEqual(result, abs);
	});

	it('treats packagePath without .vsix extension as a directory and appends the default name', () => {
		const result = resolveVsixPath({ cwd: tmpDir, packagePath: 'dist' });
		assert.strictEqual(result, path.join(tmpDir, 'dist', 'my-ext-1.2.3.vsix'));
	});

	it('includes target in the default filename when target is set', () => {
		const result = resolveVsixPath({ cwd: tmpDir, target: 'linux-x64' });
		assert.strictEqual(result, path.join(tmpDir, 'my-ext-linux-x64-1.2.3.vsix'));
	});

	it('includes target in the default filename when packagePath is a directory', () => {
		const result = resolveVsixPath({ cwd: tmpDir, packagePath: 'dist', target: 'win32-x64' });
		assert.strictEqual(result, path.join(tmpDir, 'dist', 'my-ext-win32-x64-1.2.3.vsix'));
	});

	it('resolves a relative cwd against process.cwd()', () => {
		// Write a package.json in a sub-dir relative to process.cwd()
		const subDir = path.join(process.cwd(), '__test_sub__');
		fs.mkdirSync(subDir, { recursive: true });
		fs.writeJsonSync(path.join(subDir, 'package.json'), { name: 'sub-ext', version: '0.1.0' });
		try {
			const result = resolveVsixPath({ cwd: '__test_sub__' });
			assert.strictEqual(result, path.resolve(process.cwd(), '__test_sub__', 'sub-ext-0.1.0.vsix'));
		} finally {
			fs.removeSync(subDir);
		}
	});

	it('handles the monorepo use-case: cwd=sub-package, packagePath=explicit .vsix name', () => {
		// Mirrors the Kaoto workaround: output a named vsix in the sub-package directory
		const result = resolveVsixPath({ cwd: tmpDir, packagePath: 'kaoto-2.12.0-dev.vsix', useYarn: true, dependencies: false });
		assert.strictEqual(result, path.join(tmpDir, 'kaoto-2.12.0-dev.vsix'));
	});
});

describe('resolveVsixPath — glob patterns', () => {
	let tmpDir: string;

	beforeEach(() => {
		tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'extester-test-'));
		fs.writeJsonSync(path.join(tmpDir, 'package.json'), { name: 'my-ext', version: '1.2.3' });
	});

	afterEach(() => {
		fs.removeSync(tmpDir);
	});

	it('returns the pattern resolved against cwd when packagePath contains *', () => {
		const result = resolveVsixPath({ cwd: tmpDir, packagePath: 'vscode-kaoto-*.vsix' });
		assert.strictEqual(result, path.join(tmpDir, 'vscode-kaoto-*.vsix'));
	});

	it('returns the pattern resolved against cwd when packagePath contains ?', () => {
		const result = resolveVsixPath({ cwd: tmpDir, packagePath: 'my-ext-?.?.?.vsix' });
		assert.strictEqual(result, path.join(tmpDir, 'my-ext-?.?.?.vsix'));
	});

	it('returns an absolute glob pattern unchanged when packagePath is already absolute', () => {
		const abs = path.join(tmpDir, 'dist', 'vscode-kaoto-*.vsix');
		const result = resolveVsixPath({ cwd: tmpDir, packagePath: abs });
		assert.strictEqual(result, abs);
	});

	it('does not read package.json when packagePath is a glob pattern', () => {
		// Remove the package.json — resolveVsixPath must not try to require() it
		fs.removeSync(path.join(tmpDir, 'package.json'));
		assert.doesNotThrow(() => resolveVsixPath({ cwd: tmpDir, packagePath: 'vscode-kaoto-*.vsix' }));
	});
});
