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

/**
 * Writes an additional config file (creating subdirectories as needed) under an existing tmp dir.
 */
function writeExtraConfig(dir: string, relPath: string, content: string): string {
	const file = path.join(dir, relPath);
	fs.mkdirSync(path.dirname(file), { recursive: true });
	fs.writeFileSync(file, content, 'utf8');
	return file;
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
			// testFiles use forward slashes regardless of OS (glob-safe), plain paths use path.resolve.
			const dirFwd = dir.split(path.sep).join('/');
			try {
				const cfg = await loadConfig(file);
				assert.strictEqual(cfg.run?.settings, path.resolve(dir, 'vscode-settings.json'));
				assert.strictEqual(cfg.run?.mochaConfig, path.resolve(dir, '.mocharc.js'));
				assert.strictEqual(cfg.run?.customPageObjects, path.resolve(dir, 'out/locators.js'));
				assert.deepStrictEqual(cfg.run?.testFiles, [`${dirFwd}/out/**/*.test.js`]);
				assert.deepStrictEqual(cfg.run?.resources, [path.resolve(dir, '.'), path.resolve(dir, 'fixtures')]);
			} finally {
				fs.rmSync(dir, { recursive: true });
			}
		});

		it('preserves glob syntax including extglob patterns in testFiles', async () => {
			const { dir, file } = makeTmpConfig(
				JSON.stringify({
					run: {
						testFiles: ['./out/test/**/!(clipboard)*.test.js', './out/test/system/clipboard.test.js'],
					},
				}),
			);
			const dirFwd = dir.split(path.sep).join('/');
			try {
				const cfg = await loadConfig(file);
				// The extglob !(clipboard) must be preserved exactly; no path.resolve on glob chars.
				assert.deepStrictEqual(cfg.run?.testFiles, [`${dirFwd}/out/test/**/!(clipboard)*.test.js`, `${dirFwd}/out/test/system/clipboard.test.js`]);
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

	describe('locale field', () => {
		it('passes locale through unchanged in run section', async () => {
			const { file } = makeTmpConfig(JSON.stringify({ run: { locale: 'zh-cn' } }));
			try {
				const cfg = await loadConfig(file);
				assert.strictEqual(cfg.run?.locale, 'zh-cn');
			} finally {
				fs.rmSync(path.dirname(file), { recursive: true });
			}
		});

		it('locale is omitted when not set', async () => {
			const { file } = makeTmpConfig(JSON.stringify({ run: { testFiles: ['./out/**/*.test.js'] } }));
			try {
				const cfg = await loadConfig(file);
				assert.strictEqual(cfg.run?.locale, undefined);
			} finally {
				fs.rmSync(path.dirname(file), { recursive: true });
			}
		});
	});

	describe('extends', () => {
		it('inherits values from a single extended base and strips the extends key', async () => {
			const { dir, file } = makeTmpConfig(JSON.stringify({ extends: './base.json' }));
			writeExtraConfig(dir, 'base.json', JSON.stringify({ setup: { vscodeVersion: '1.131.0' }, run: { logLevel: 'Debug' } }));
			try {
				const cfg = await loadConfig(file);
				assert.strictEqual(cfg.setup?.vscodeVersion, '1.131.0');
				assert.strictEqual(cfg.run?.logLevel, 'Debug');
				assert.ok(!('extends' in cfg), 'extends key must not appear in the loaded config');
			} finally {
				fs.rmSync(dir, { recursive: true });
			}
		});

		it('lets the extending file override a scalar from the base', async () => {
			const { dir, file } = makeTmpConfig(JSON.stringify({ extends: './base.json', setup: { vscodeVersion: 'max' } }));
			writeExtraConfig(dir, 'base.json', JSON.stringify({ setup: { vscodeVersion: '1.131.0', type: 'insider' } }));
			try {
				const cfg = await loadConfig(file);
				assert.strictEqual(cfg.setup?.vscodeVersion, 'max');
				assert.strictEqual(cfg.setup?.type, 'insider');
			} finally {
				fs.rmSync(dir, { recursive: true });
			}
		});

		it('deep-merges nested objects from base and extending file', async () => {
			const { dir, file } = makeTmpConfig(JSON.stringify({ extends: './base.json', setup: { packageOptions: { preRelease: true } } }));
			writeExtraConfig(dir, 'base.json', JSON.stringify({ setup: { packageOptions: { useYarn: true } } }));
			try {
				const cfg = await loadConfig(file);
				assert.strictEqual(cfg.setup?.packageOptions?.useYarn, true);
				assert.strictEqual(cfg.setup?.packageOptions?.preRelease, true);
			} finally {
				fs.rmSync(dir, { recursive: true });
			}
		});

		it('replaces arrays whole instead of concatenating them', async () => {
			const { dir, file } = makeTmpConfig(JSON.stringify({ extends: './base.json', run: { testFiles: ['./b/**/*.test.js'] } }));
			writeExtraConfig(dir, 'base.json', JSON.stringify({ run: { testFiles: ['./a/**/*.test.js'], resources: ['./fixtures'] } }));
			const dirFwd = dir.split(path.sep).join('/');
			try {
				const cfg = await loadConfig(file);
				// Child's testFiles fully replace the base's, resolved against the child's directory.
				assert.deepStrictEqual(cfg.run?.testFiles, [`${dirFwd}/b/**/*.test.js`]);
				// Untouched base arrays are inherited, resolved against the base's directory.
				assert.deepStrictEqual(cfg.run?.resources, [path.resolve(dir, 'fixtures')]);
			} finally {
				fs.rmSync(dir, { recursive: true });
			}
		});

		it('applies multiple bases in order, later entries overriding earlier ones', async () => {
			const { dir, file } = makeTmpConfig(JSON.stringify({ extends: ['./base1.json', './base2.json'], run: { locale: 'fr' } }));
			writeExtraConfig(dir, 'base1.json', JSON.stringify({ setup: { vscodeVersion: '1.130.0' }, run: { locale: 'ru', cleanup: true } }));
			writeExtraConfig(dir, 'base2.json', JSON.stringify({ setup: { vscodeVersion: '1.131.0' } }));
			try {
				const cfg = await loadConfig(file);
				assert.strictEqual(cfg.setup?.vscodeVersion, '1.131.0');
				assert.strictEqual(cfg.run?.locale, 'fr');
				assert.strictEqual(cfg.run?.cleanup, true);
			} finally {
				fs.rmSync(dir, { recursive: true });
			}
		});

		it('follows extends chains across multiple levels', async () => {
			const { dir, file } = makeTmpConfig(JSON.stringify({ extends: './b.json', setup: { vscodeVersion: 'max' } }));
			writeExtraConfig(dir, 'b.json', JSON.stringify({ extends: './a.json', setup: { vscodeVersion: '1.131.0', type: 'insider' } }));
			writeExtraConfig(dir, 'a.json', JSON.stringify({ setup: { vscodeVersion: '1.130.0', installDependencies: true } }));
			try {
				const cfg = await loadConfig(file);
				assert.strictEqual(cfg.setup?.vscodeVersion, 'max');
				assert.strictEqual(cfg.setup?.type, 'insider');
				assert.strictEqual(cfg.setup?.installDependencies, true);
			} finally {
				fs.rmSync(dir, { recursive: true });
			}
		});

		it('resolves relative paths in each file against that file own directory', async () => {
			const { dir, file } = makeTmpConfig(JSON.stringify({ extends: './shared/base.json', run: { settings: './settings.json' } }));
			writeExtraConfig(
				dir,
				path.join('shared', 'base.json'),
				JSON.stringify({ setup: { storage: './base-storage' }, run: { testFiles: ['./out/**/*.test.js'] } }),
			);
			const dirFwd = dir.split(path.sep).join('/');
			try {
				const cfg = await loadConfig(file);
				assert.strictEqual(cfg.setup?.storage, path.resolve(dir, 'shared', 'base-storage'));
				assert.deepStrictEqual(cfg.run?.testFiles, [`${dirFwd}/shared/out/**/*.test.js`]);
				assert.strictEqual(cfg.run?.settings, path.resolve(dir, 'settings.json'));
			} finally {
				fs.rmSync(dir, { recursive: true });
			}
		});

		it('throws a descriptive error on circular extends', async () => {
			const { dir, file } = makeTmpConfig(JSON.stringify({ extends: './b.json' }));
			writeExtraConfig(dir, 'b.json', JSON.stringify({ extends: './extester.config.json' }));
			try {
				await assert.rejects(
					() => loadConfig(file),
					(err: Error) => {
						assert.ok(err instanceof Error);
						assert.ok(err.message.includes('circular extends'));
						assert.ok(err.message.includes('extester.config.json'));
						assert.ok(err.message.includes('b.json'));
						return true;
					},
				);
			} finally {
				fs.rmSync(dir, { recursive: true });
			}
		});

		it('throws on a config extending itself', async () => {
			const { dir, file } = makeTmpConfig(JSON.stringify({ extends: './extester.config.json' }));
			try {
				await assert.rejects(
					() => loadConfig(file),
					(err: Error) => {
						assert.ok(err instanceof Error);
						assert.ok(err.message.includes('circular extends'));
						return true;
					},
				);
			} finally {
				fs.rmSync(dir, { recursive: true });
			}
		});

		it('throws a descriptive error when an extended file does not exist', async () => {
			const { dir, file } = makeTmpConfig(JSON.stringify({ extends: './does-not-exist.json' }));
			try {
				await assert.rejects(
					() => loadConfig(file),
					(err: Error) => {
						assert.ok(err instanceof Error);
						assert.ok(err.message.includes('extended config file not found'));
						assert.ok(err.message.includes(path.join(dir, 'does-not-exist.json')));
						return true;
					},
				);
			} finally {
				fs.rmSync(dir, { recursive: true });
			}
		});

		it('throws when an extended file is not a .json file', async () => {
			const { dir, file } = makeTmpConfig(JSON.stringify({ extends: './base.txt' }));
			writeExtraConfig(dir, 'base.txt', JSON.stringify({ setup: { vscodeVersion: '1.131.0' } }));
			try {
				await assert.rejects(
					() => loadConfig(file),
					(err: Error) => {
						assert.ok(err instanceof Error);
						assert.ok(err.message.includes('.json'));
						return true;
					},
				);
			} finally {
				fs.rmSync(dir, { recursive: true });
			}
		});

		it('names the base file when it contains invalid JSON', async () => {
			const { dir, file } = makeTmpConfig(JSON.stringify({ extends: './base.json' }));
			const baseFile = writeExtraConfig(dir, 'base.json', '{bad json}');
			try {
				await assert.rejects(
					() => loadConfig(file),
					(err: Error) => {
						assert.ok(err instanceof Error);
						assert.ok(err.message.includes('invalid JSON'));
						assert.ok(err.message.includes(baseFile));
						return true;
					},
				);
			} finally {
				fs.rmSync(dir, { recursive: true });
			}
		});

		it('throws when extends is neither a string nor an array of strings', async () => {
			const { dir, file } = makeTmpConfig(JSON.stringify({ extends: 42 }));
			try {
				await assert.rejects(
					() => loadConfig(file),
					(err: Error) => {
						assert.ok(err instanceof Error);
						assert.ok(err.message.includes('extends'));
						return true;
					},
				);
			} finally {
				fs.rmSync(dir, { recursive: true });
			}
		});

		it('supports absolute paths in extends', async () => {
			const { dir, file: entry } = makeTmpConfig('{}');
			const baseFile = writeExtraConfig(dir, 'abs-base.json', JSON.stringify({ setup: { vscodeVersion: '1.131.0' } }));
			fs.writeFileSync(entry, JSON.stringify({ extends: baseFile }), 'utf8');
			try {
				const cfg = await loadConfig(entry);
				assert.strictEqual(cfg.setup?.vscodeVersion, '1.131.0');
			} finally {
				fs.rmSync(dir, { recursive: true });
			}
		});

		it('loads diamond-shaped extends without a false circular error', async () => {
			const { dir, file } = makeTmpConfig(JSON.stringify({ extends: ['./b.json', './c.json'] }));
			writeExtraConfig(dir, 'b.json', JSON.stringify({ extends: './shared.json', run: { cleanup: true } }));
			writeExtraConfig(dir, 'c.json', JSON.stringify({ extends: './shared.json', run: { offline: true } }));
			writeExtraConfig(dir, 'shared.json', JSON.stringify({ setup: { vscodeVersion: '1.131.0' } }));
			try {
				const cfg = await loadConfig(file);
				assert.strictEqual(cfg.setup?.vscodeVersion, '1.131.0');
				assert.strictEqual(cfg.run?.cleanup, true);
				assert.strictEqual(cfg.run?.offline, true);
			} finally {
				fs.rmSync(dir, { recursive: true });
			}
		});

		it('does not pollute Object.prototype through merged configs', async () => {
			const { dir, file } = makeTmpConfig(JSON.stringify({ extends: './base.json' }));
			writeExtraConfig(dir, 'base.json', '{"__proto__": {"polluted": true}, "setup": {"vscodeVersion": "1.131.0"}}');
			try {
				const cfg = await loadConfig(file);
				// Inheritance still works…
				assert.strictEqual(cfg.setup?.vscodeVersion, '1.131.0');
				// …but the malicious key must not reach Object.prototype.
				assert.strictEqual(({} as Record<string, unknown>).polluted, undefined);
			} finally {
				fs.rmSync(dir, { recursive: true });
			}
		});
	});
});
