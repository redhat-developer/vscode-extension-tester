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
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { loadConfig } from '../config';

/**
 * Creates a temporary directory, writes an extester.config.json with the given content,
 * and returns the directory path + config file path.
 */
function makeTmpConfig(content: string): { dir: string; file: string } {
	// Use realpathSync so expected paths in assertions match what loadConfig produces
	// after it resolves symlinks (e.g. /var/… → /private/var/… on macOS).
	const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'extester-config-test-')));
	const file = path.join(dir, 'extester.config.json');
	fs.writeFileSync(file, content, 'utf8');
	return { dir, file };
}

describe('loadConfig', () => {
	describe('auto-discovery', () => {
		it('returns an empty object when no extester.config.json is found', async () => {
			// Point find-up to a tmp dir with no config file — it will walk up and not find one
			// (unless the repo itself has one, which it does not).
			const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'extester-no-config-'));
			const orig = process.cwd();
			process.chdir(dir);
			try {
				const cfg = await loadConfig();
				assert.deepStrictEqual(cfg, {});
			} finally {
				process.chdir(orig);
				fs.rmdirSync(dir);
			}
		});

		it('finds and parses extester.config.json from cwd', async () => {
			const { dir } = makeTmpConfig(JSON.stringify({ setup: { vscodeVersion: '1.131.0' } }));
			const orig = process.cwd();
			process.chdir(dir);
			try {
				const cfg = await loadConfig();
				assert.strictEqual(cfg.setup?.vscodeVersion, '1.131.0');
			} finally {
				process.chdir(orig);
				fs.rmSync(dir, { recursive: true });
			}
		});
	});

	describe('explicit configPath', () => {
		it('reads the file at the given path', async () => {
			const { file } = makeTmpConfig(JSON.stringify({ run: { testFiles: ['./out/**/*.test.js'] } }));
			try {
				const cfg = await loadConfig(file);
				// testFiles should be resolved to an absolute path
				assert.ok(Array.isArray(cfg.run?.testFiles));
				assert.ok(path.isAbsolute(cfg.run!.testFiles![0]));
			} finally {
				fs.rmSync(path.dirname(file), { recursive: true });
			}
		});

		it('throws a descriptive error when the explicit path does not exist', async () => {
			await assert.rejects(
				() => loadConfig('/nonexistent/path/extester.config.json'),
				(err: Error) => {
					assert.ok(err instanceof Error);
					assert.ok(err.message.includes('file not found'));
					return true;
				},
			);
		});
	});

	describe('JSON parsing', () => {
		it('throws a descriptive error for invalid JSON', async () => {
			const { file } = makeTmpConfig('{not valid json}');
			try {
				await assert.rejects(
					() => loadConfig(file),
					(err: Error) => {
						assert.ok(err instanceof Error);
						assert.ok(err.message.includes('invalid JSON'));
						return true;
					},
				);
			} finally {
				fs.rmSync(path.dirname(file), { recursive: true });
			}
		});

		it('parses a complete config with both setup and run sections', async () => {
			const content = JSON.stringify({
				setup: { vscodeVersion: 'latest', type: 'stable', installDependencies: true, noCache: false },
				run: { testFiles: ['./out/**/*.test.js'], logLevel: 'Info', offline: false, resources: ['.'], cleanup: true },
			});
			const { file } = makeTmpConfig(content);
			try {
				const cfg = await loadConfig(file);
				assert.strictEqual(cfg.setup?.vscodeVersion, 'latest');
				assert.strictEqual(cfg.setup?.type, 'stable');
				assert.strictEqual(cfg.setup?.installDependencies, true);
				assert.strictEqual(cfg.run?.logLevel, 'Info');
				assert.strictEqual(cfg.run?.cleanup, true);
			} finally {
				fs.rmSync(path.dirname(file), { recursive: true });
			}
		});
	});

	describe('path resolution', () => {
		it('resolves relative paths in setup section relative to config file directory', async () => {
			const { dir, file } = makeTmpConfig(JSON.stringify({ setup: { storage: './test-resources', extensionsDir: './test-extensions' } }));
			try {
				const cfg = await loadConfig(file);
				assert.strictEqual(cfg.setup?.storage, path.resolve(dir, 'test-resources'));
				assert.strictEqual(cfg.setup?.extensionsDir, path.resolve(dir, 'test-extensions'));
			} finally {
				fs.rmSync(dir, { recursive: true });
			}
		});

		it('resolves relative paths in run section relative to config file directory', async () => {
			const { dir, file } = makeTmpConfig(
				JSON.stringify({
					run: {
						settings: './vscode-settings.json',
						mochaConfig: './.mocharc.js',
						customPageObjects: './out/locators.js',
						testFiles: ['./out/**/*.test.js'],
						resources: ['.', './fixtures'],
					},
				}),
			);
			try {
				const cfg = await loadConfig(file);
				assert.strictEqual(cfg.run?.settings, path.resolve(dir, 'vscode-settings.json'));
				assert.strictEqual(cfg.run?.mochaConfig, path.resolve(dir, '.mocharc.js'));
				assert.strictEqual(cfg.run?.customPageObjects, path.resolve(dir, 'out/locators.js'));
				assert.deepStrictEqual(cfg.run?.testFiles, [path.resolve(dir, 'out/**/*.test.js')]);
				assert.deepStrictEqual(cfg.run?.resources, [path.resolve(dir, '.'), path.resolve(dir, 'fixtures')]);
			} finally {
				fs.rmSync(dir, { recursive: true });
			}
		});

		it('does not alter already-absolute paths', async () => {
			const absPath = os.tmpdir();
			const { file } = makeTmpConfig(JSON.stringify({ setup: { storage: absPath } }));
			try {
				const cfg = await loadConfig(file);
				assert.strictEqual(cfg.setup?.storage, absPath);
			} finally {
				fs.rmSync(path.dirname(file), { recursive: true });
			}
		});
	});
});
