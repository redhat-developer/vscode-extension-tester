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
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as vsce from '@vscode/vsce';
import type { IPackageOptions } from '@vscode/vsce';
import {
	CodeUtil,
	getDefaultSettings,
	overriddenDefaultKeys,
	removeDirWithRetry,
	seedKeybindingsFile,
	seedSnippetsDir,
	validateUserDataDirLength,
	flagConflictWarnings,
	findShadowedSettings,
} from '../util/codeUtil';
import { ReleaseQuality } from '../util/codeUtil';
import { Download } from '../util/download';

describe('CodeUtil.packageExtension', () => {
	let originalCreateVSIX: typeof vsce.createVSIX;
	let capturedOptions: IPackageOptions | undefined;

	beforeEach(() => {
		// Stub vsce.createVSIX to capture whatever is passed in
		originalCreateVSIX = vsce.createVSIX;
		capturedOptions = undefined;
		(vsce as { createVSIX: unknown }).createVSIX = async (opts: IPackageOptions) => {
			capturedOptions = opts;
		};
	});

	afterEach(() => {
		// Restore original
		(vsce as { createVSIX: unknown }).createVSIX = originalCreateVSIX;
	});

	function makeCodeUtil(): CodeUtil {
		// Use a temp path; no disk access is needed for these tests
		return new CodeUtil('/tmp/test-resources', ReleaseQuality.Stable);
	}

	it('calls createVSIX with an empty object when no options are provided', async () => {
		const util = makeCodeUtil();
		await util.packageExtension(undefined);
		assert.deepStrictEqual(capturedOptions, {});
	});

	it('forwards useYarn to createVSIX', async () => {
		const util = makeCodeUtil();
		await util.packageExtension({ useYarn: true });
		assert.deepStrictEqual(capturedOptions, { useYarn: true });
	});

	it('forwards followSymlinks to createVSIX', async () => {
		const util = makeCodeUtil();
		await util.packageExtension({ followSymlinks: true });
		assert.deepStrictEqual(capturedOptions, { followSymlinks: true });
	});

	it('forwards a combination of options to createVSIX', async () => {
		const options: IPackageOptions = { useYarn: true, followSymlinks: true, preRelease: true };
		const util = makeCodeUtil();
		await util.packageExtension(options);
		assert.deepStrictEqual(capturedOptions, options);
	});

	it('does not mutate the options object passed in', async () => {
		const options: IPackageOptions = { useYarn: true };
		const frozen = Object.freeze(options);
		const util = makeCodeUtil();
		await util.packageExtension(frozen);
		assert.deepStrictEqual(capturedOptions, { useYarn: true });
	});
});

describe('CodeUtil.parseSettings', () => {
	let dir: string;

	beforeEach(async () => {
		dir = await fs.mkdtemp(path.join(os.tmpdir(), 'extest-settings-'));
	});

	afterEach(async () => {
		await fs.remove(dir);
	});

	type WithParseSettings = { parseSettings(settingsPath: string): object };

	function parseContent(content: string): object {
		const file = path.join(dir, 'settings.json');
		fs.writeFileSync(file, content);
		const util = new CodeUtil(dir, ReleaseQuality.Stable) as unknown as WithParseSettings;
		return util.parseSettings(file);
	}

	it('returns an empty object when no path is given', () => {
		const util = new CodeUtil(dir, ReleaseQuality.Stable) as unknown as WithParseSettings;
		assert.deepStrictEqual(util.parseSettings(''), {});
	});

	it('parses a plain JSON object', () => {
		assert.deepStrictEqual(parseContent('{"update.mode": "none"}'), { 'update.mode': 'none' });
	});

	it('accepts JSONC comments and trailing commas like VS Code settings.json does', () => {
		const jsonc = '{\n\t// comment line\n\t"workbench.statusBar.visible": false,\n\t/* block comment */\n\t"window.zoomLevel": 1,\n}';
		assert.deepStrictEqual(parseContent(jsonc), { 'workbench.statusBar.visible': false, 'window.zoomLevel': 1 });
	});

	it('returns an empty object for an empty settings file', () => {
		assert.deepStrictEqual(parseContent('  \n\t\n'), {});
	});

	it('rejects a root-level array with an error naming the type', () => {
		assert.throws(() => parseContent('["not", "settings"]'), /must contain a JSON object at the root.*array/);
	});

	it('rejects a root-level string with an error naming the type', () => {
		assert.throws(() => parseContent('"just a string"'), /must contain a JSON object at the root.*string/);
	});

	it('rejects a root-level null with an error naming the type', () => {
		assert.throws(() => parseContent('null'), /must contain a JSON object at the root.*null/);
	});

	it('rejects malformed JSON with an error naming the file', () => {
		assert.throws(
			() => parseContent('{"a": }'),
			(err: Error) => err.message.includes(path.join(dir, 'settings.json')),
		);
	});

	it('throws a readable error for an unreadable file', () => {
		const util = new CodeUtil(dir, ReleaseQuality.Stable) as unknown as WithParseSettings;
		assert.throws(() => util.parseSettings(path.join(dir, 'missing.json')), /Unable to read settings/);
	});
});

describe('getDefaultSettings', () => {
	it('keeps every framework default scalar so the shallow custom-settings merge stays faithful', () => {
		// VS Code replaces object-valued settings whole at each scope, so the
		// shallow spread in VSBrowser.start() is only correct while no default
		// has an object or array value. This test guards that invariant.
		for (const [key, value] of Object.entries(getDefaultSettings('1.135.0'))) {
			assert.ok(value === null || typeof value !== 'object', `default '${key}' must not have an object/array value`);
		}
	});

	it('uses the current enum form for extensions.autoUpdate to avoid the VS Code migration rewrite', () => {
		assert.strictEqual(getDefaultSettings('1.135.0')['extensions.autoUpdate'], 'off');
	});

	it('gates window.menuStyle on VS Code >= 1.101.0', () => {
		assert.strictEqual(getDefaultSettings('1.100.0')['window.menuStyle'], undefined);
		assert.strictEqual(getDefaultSettings('1.101.0')['window.menuStyle'], 'custom');
	});

	it('pushes workbench hovers out of reach so they cannot intercept clicks', () => {
		assert.strictEqual(getDefaultSettings('1.135.0')['workbench.hover.delay'], 604_800_000);
	});

	it('disables editor sticky scroll so its overlay cannot intercept clicks on top editor lines', () => {
		assert.strictEqual(getDefaultSettings('1.135.0')['editor.stickyScroll.enabled'], false);
	});

	it('replaces object-valued custom settings whole in the merge, like VS Code scopes do', () => {
		const merged = { ...getDefaultSettings('1.135.0'), ...{ 'files.exclude': { '**/out': true } } };
		assert.deepStrictEqual(merged['files.exclude'], { '**/out': true });
	});
});

describe('removeDirWithRetry', () => {
	// stub via the underlying CJS module object — the TS namespace import wrapper
	// exposes re-exports through getters and cannot be assigned to
	const fsModule = require('fs-extra') as { removeSync: (dir: string) => void };
	let dir: string;
	const originalRemoveSync = fsModule.removeSync;

	beforeEach(async () => {
		dir = await fs.mkdtemp(path.join(os.tmpdir(), 'extest-wipe-'));
	});

	afterEach(async () => {
		fsModule.removeSync = originalRemoveSync;
		await fs.remove(dir);
	});

	function busyError(): NodeJS.ErrnoException {
		const err: NodeJS.ErrnoException = new Error('EBUSY: resource busy or locked');
		err.code = 'EBUSY';
		return err;
	}

	it('removes an existing directory', async () => {
		fs.outputFileSync(path.join(dir, 'User', 'settings.json'), '{}');
		await removeDirWithRetry(dir);
		assert.strictEqual(fs.existsSync(dir), false);
	});

	it('retries once when the first removal reports EBUSY', async () => {
		let calls = 0;
		fsModule.removeSync = (target: string) => {
			calls++;
			if (calls === 1) {
				throw busyError();
			}
			originalRemoveSync(target);
		};
		await removeDirWithRetry(dir);
		assert.strictEqual(calls, 2);
		assert.strictEqual(fs.existsSync(dir), false);
	});

	it('fails loudly when EBUSY persists after the retry', async () => {
		fsModule.removeSync = () => {
			throw busyError();
		};
		await assert.rejects(() => removeDirWithRetry(dir), /Could not clean the settings directory.*EBUSY/s);
	});
});

describe('seedKeybindingsFile', () => {
	let dir: string;
	let userDir: string;

	beforeEach(async () => {
		dir = await fs.mkdtemp(path.join(os.tmpdir(), 'extest-keybindings-'));
		userDir = path.join(dir, 'User');
		fs.mkdirpSync(userDir);
	});

	afterEach(async () => {
		await fs.remove(dir);
	});

	it('copies a JSONC keybindings file verbatim, preserving comments', () => {
		const source = path.join(dir, 'my-keybindings.json');
		const content = '[\n\t// run tests\n\t{ "key": "ctrl+t", "command": "workbench.action.tasks.test" },\n]';
		fs.writeFileSync(source, content);
		seedKeybindingsFile(source, userDir);
		assert.strictEqual(fs.readFileSync(path.join(userDir, 'keybindings.json'), 'utf-8'), content);
	});

	it('rejects a keybindings file whose root is not an array', () => {
		const source = path.join(dir, 'object.json');
		fs.writeFileSync(source, '{ "key": "ctrl+t" }');
		assert.throws(() => seedKeybindingsFile(source, userDir), /must contain a JSON array at the root.*object/);
	});

	it('rejects a malformed keybindings file naming the file', () => {
		const source = path.join(dir, 'broken.json');
		fs.writeFileSync(source, '[{ "key": ]');
		assert.throws(
			() => seedKeybindingsFile(source, userDir),
			(err: Error) => err.message.includes(source),
		);
	});

	it('rejects a missing keybindings file with a readable error', () => {
		assert.throws(() => seedKeybindingsFile(path.join(dir, 'missing.json'), userDir), /Unable to read keybindings/);
	});
});

describe('seedSnippetsDir', () => {
	let dir: string;
	let userDir: string;

	beforeEach(async () => {
		dir = await fs.mkdtemp(path.join(os.tmpdir(), 'extest-snippets-'));
		userDir = path.join(dir, 'User');
		fs.mkdirpSync(userDir);
	});

	afterEach(async () => {
		await fs.remove(dir);
	});

	it('copies snippet files into User/snippets', () => {
		const source = path.join(dir, 'my-snippets');
		fs.outputFileSync(path.join(source, 'typescript.json'), '{}');
		fs.outputFileSync(path.join(source, 'global.code-snippets'), '{}');
		seedSnippetsDir(source, userDir);
		assert.ok(fs.existsSync(path.join(userDir, 'snippets', 'typescript.json')));
		assert.ok(fs.existsSync(path.join(userDir, 'snippets', 'global.code-snippets')));
	});

	it('rejects a path that is not a directory', () => {
		const file = path.join(dir, 'not-a-dir.json');
		fs.writeFileSync(file, '{}');
		assert.throws(() => seedSnippetsDir(file, userDir), /must be a directory/);
	});

	it('rejects a missing snippets directory with a readable error', () => {
		assert.throws(() => seedSnippetsDir(path.join(dir, 'missing'), userDir), /Unable to read snippets/);
	});
});

describe('CodeUtil.uninstallExtension', () => {
	it('is a no-op without touching package.json when cleanup is off', async () => {
		const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'extest-no-pjson-'));
		const orig = process.cwd();
		process.chdir(dir);
		try {
			const util = new CodeUtil(dir, ReleaseQuality.Stable);
			// must not require ./package.json (absent here) when there is nothing to clean up
			assert.doesNotThrow(() => util.uninstallExtension(false));
			assert.doesNotThrow(() => util.uninstallExtension(undefined));
		} finally {
			process.chdir(orig);
			await fs.remove(dir);
		}
	});
});

describe('overriddenDefaultKeys', () => {
	const defaults = { 'update.mode': 'none', 'window.titleBarStyle': 'custom', 'workbench.reduceMotion': 'on' };

	it('lists custom keys that change a default value', () => {
		const custom = { 'window.titleBarStyle': 'native', 'update.mode': 'default' };
		assert.deepStrictEqual(overriddenDefaultKeys(defaults, custom), ['window.titleBarStyle', 'update.mode']);
	});

	it('ignores custom keys that are not framework defaults', () => {
		const custom = { 'editor.fontSize': 20, 'files.autoSave': 'off' };
		assert.deepStrictEqual(overriddenDefaultKeys(defaults, custom), []);
	});

	it('ignores custom keys set to the same value as the default', () => {
		const custom = { 'update.mode': 'none', 'workbench.reduceMotion': 'off' };
		assert.deepStrictEqual(overriddenDefaultKeys(defaults, custom), ['workbench.reduceMotion']);
	});

	it('returns an empty list for empty custom settings', () => {
		assert.deepStrictEqual(overriddenDefaultKeys(defaults, {}), []);
	});
});

describe('CodeUtil.writeUserSettings', () => {
	let dir: string;

	beforeEach(async () => {
		dir = await fs.mkdtemp(path.join(os.tmpdir(), 'extest-setup-settings-'));
	});

	afterEach(async () => {
		await fs.remove(dir);
	});

	it('writes parsed JSONC settings into the storage settings dir, tab-indented', () => {
		const settingsFile = path.join(dir, 'custom.json');
		fs.writeFileSync(settingsFile, '{\n// proxy for marketplace installs\n"http.proxy": "http://proxy:3128",\n}');
		const util = new CodeUtil(dir, ReleaseQuality.Stable);
		util.writeUserSettings(settingsFile);
		const written = fs.readFileSync(path.join(dir, 'settings', 'User', 'settings.json'), 'utf-8');
		assert.ok(written.includes('\t"http.proxy": "http://proxy:3128"'), 'settings should be written tab-indented');
	});

	it('does nothing when no settings path is given', () => {
		const util = new CodeUtil(dir, ReleaseQuality.Stable);
		util.writeUserSettings('');
		assert.strictEqual(fs.existsSync(path.join(dir, 'settings', 'User', 'settings.json')), false);
	});

	it('propagates validation errors from the settings file', () => {
		const settingsFile = path.join(dir, 'bad.json');
		fs.writeFileSync(settingsFile, '["not settings"]');
		const util = new CodeUtil(dir, ReleaseQuality.Stable);
		assert.throws(() => util.writeUserSettings(settingsFile), /must contain a JSON object at the root/);
	});
});

describe('findShadowedSettings', () => {
	let dir: string;

	beforeEach(async () => {
		dir = await fs.mkdtemp(path.join(os.tmpdir(), 'extest-shadow-'));
	});

	afterEach(async () => {
		await fs.remove(dir);
	});

	function writeWorkspaceSettings(content: string): void {
		fs.outputFileSync(path.join(dir, '.vscode', 'settings.json'), content);
	}

	it('reports a custom key that the workspace file sets to a different value', () => {
		writeWorkspaceSettings('{"workbench.statusBar.visible": true}');
		const shadowed = findShadowedSettings(dir, { 'workbench.statusBar.visible': false });
		assert.deepStrictEqual(shadowed, [{ key: 'workbench.statusBar.visible', workspaceValue: true }]);
	});

	it('ignores keys the workspace file sets to the same value', () => {
		writeWorkspaceSettings('{"workbench.statusBar.visible": false}');
		assert.deepStrictEqual(findShadowedSettings(dir, { 'workbench.statusBar.visible': false }), []);
	});

	it('ignores workspace keys that are not in the custom settings', () => {
		writeWorkspaceSettings('{"window.zoomLevel": -1.5}');
		assert.deepStrictEqual(findShadowedSettings(dir, { 'workbench.statusBar.visible': false }), []);
	});

	it('returns nothing for a folder without workspace settings', () => {
		assert.deepStrictEqual(findShadowedSettings(dir, { 'workbench.statusBar.visible': false }), []);
	});

	it('returns nothing for a file path', () => {
		const file = path.join(dir, 'some.txt');
		fs.writeFileSync(file, 'hello');
		assert.deepStrictEqual(findShadowedSettings(file, { 'workbench.statusBar.visible': false }), []);
	});

	it('reads JSONC workspace files with comments and trailing commas', () => {
		writeWorkspaceSettings('{\n\t// zoom for CI\n\t"window.zoomLevel": -1.5,\n}');
		const shadowed = findShadowedSettings(dir, { 'window.zoomLevel': 0 });
		assert.deepStrictEqual(shadowed, [{ key: 'window.zoomLevel', workspaceValue: -1.5 }]);
	});

	it('never throws on a malformed workspace file', () => {
		writeWorkspaceSettings('{{{ not json');
		assert.deepStrictEqual(findShadowedSettings(dir, { 'window.zoomLevel': 0 }), []);
	});
});

describe('flagConflictWarnings', () => {
	it('warns when workspace trust is enabled against --disable-workspace-trust', () => {
		const warnings = flagConflictWarnings({ 'security.workspace.trust.enabled': true });
		assert.strictEqual(warnings.length, 1);
		assert.ok(warnings[0].includes('security.workspace.trust.enabled'));
		assert.ok(warnings[0].includes('--disable-workspace-trust'));
	});

	it('warns when update.mode re-enables updates against --disable-updates', () => {
		const warnings = flagConflictWarnings({ 'update.mode': 'default' });
		assert.strictEqual(warnings.length, 1);
		assert.ok(warnings[0].includes('--disable-updates'));
	});

	it('stays quiet when update.mode matches the disabled state', () => {
		assert.deepStrictEqual(flagConflictWarnings({ 'update.mode': 'none' }), []);
	});

	it('warns when telemetry is turned on against --disable-telemetry', () => {
		const warnings = flagConflictWarnings({ 'telemetry.telemetryLevel': 'all' });
		assert.strictEqual(warnings.length, 1);
		assert.ok(warnings[0].includes('--disable-telemetry'));
	});

	it('stays quiet when telemetry is off', () => {
		assert.deepStrictEqual(flagConflictWarnings({ 'telemetry.telemetryLevel': 'off' }), []);
	});

	it('warns when experiments are enabled against --disable-experiments', () => {
		const warnings = flagConflictWarnings({ 'workbench.enableExperiments': true });
		assert.strictEqual(warnings.length, 1);
		assert.ok(warnings[0].includes('--disable-experiments'));
	});

	it('warns when the welcome page is requested against --skip-welcome', () => {
		const warnings = flagConflictWarnings({ 'workbench.startupEditor': 'welcomePage' });
		assert.strictEqual(warnings.length, 1);
		assert.ok(warnings[0].includes('--skip-welcome'));
	});

	it('ignores unrelated settings', () => {
		assert.deepStrictEqual(flagConflictWarnings({ 'editor.fontSize': 20, 'workbench.startupEditor': 'none' }), []);
	});

	it('reports multiple conflicts at once', () => {
		const warnings = flagConflictWarnings({ 'security.workspace.trust.enabled': true, 'update.mode': 'manual' });
		assert.strictEqual(warnings.length, 2);
	});
});

describe('validateUserDataDirLength', () => {
	it('accepts a short settings dir on darwin', () => {
		assert.strictEqual(validateUserDataDirLength('/tmp/test-resources/settings', 'darwin'), undefined);
	});

	it('rejects a settings dir whose IPC socket path would exceed the darwin limit', () => {
		const dir = '/' + 'a'.repeat(100);
		const message = validateUserDataDirLength(dir, 'darwin');
		assert.ok(message, 'expected an error message');
		assert.ok(message.includes(dir), 'message should name the offending directory');
		assert.ok(/storage|TEST_RESOURCES/.test(message), 'message should point at the storage options');
	});

	it('allows linux a few more bytes than darwin', () => {
		// socket path length lands between the darwin (104) and linux (108) limits
		const dir = '/' + 'a'.repeat(89);
		assert.ok(validateUserDataDirLength(dir, 'darwin'), 'should exceed the darwin limit');
		assert.strictEqual(validateUserDataDirLength(dir, 'linux'), undefined);
	});

	it('never complains on windows (named pipes, no socket path limit)', () => {
		assert.strictEqual(validateUserDataDirLength('C:\\' + 'a'.repeat(300), 'win32'), undefined);
	});
});

describe('CodeUtil.parseChromiumVersionFromManifest', () => {
	it('picks the registration named chromium even when it is not first', () => {
		const manifest = {
			registrations: [
				{ component: { git: { name: 'electron' } }, version: '42.8.1' },
				{ component: { git: { name: 'chromium' } }, version: '148.0.7778.280' },
			],
		};
		assert.strictEqual(CodeUtil.parseChromiumVersionFromManifest(manifest), '148.0.7778.280');
	});

	it('falls back to the first registration when none is named chromium', () => {
		const manifest = {
			registrations: [{ component: { git: { name: 'something-else' } }, version: '1.2.3.4' }],
		};
		assert.strictEqual(CodeUtil.parseChromiumVersionFromManifest(manifest), '1.2.3.4');
	});

	it('returns undefined for malformed manifests', () => {
		assert.strictEqual(CodeUtil.parseChromiumVersionFromManifest({}), undefined);
		assert.strictEqual(CodeUtil.parseChromiumVersionFromManifest({ registrations: [] }), undefined);
		assert.strictEqual(CodeUtil.parseChromiumVersionFromManifest(undefined), undefined);
	});
});

describe('CodeUtil Chromium version discovery', function () {
	this.timeout(15000);

	type Discovery = {
		getChromiumVersion(codeVersion?: string): Promise<string>;
		getChromiumVersionFromBinary(): string | undefined;
		getExistingCodeVersion(): string;
		getExecutablePath(): string;
		codeFolder: string;
	};
	const originalGetJSON = Download.getJSON;
	const originalGetFile = Download.getFile;
	let storage: string;

	beforeEach(async () => {
		storage = await fs.mkdtemp(path.join(os.tmpdir(), 'extest-code-test-'));
	});

	afterEach(async () => {
		Download.getJSON = originalGetJSON;
		Download.getFile = originalGetFile;
		await fs.remove(storage);
	});

	function makeUtil(): Discovery {
		Download.getJSON = (async () => ['9.9.9']) as typeof Download.getJSON;
		return new CodeUtil(storage, ReleaseQuality.Stable) as unknown as Discovery;
	}

	it('prefers the Chromium version read from a matching local binary', async () => {
		const util = makeUtil();
		util.getExistingCodeVersion = () => '9.9.9';
		util.getChromiumVersionFromBinary = () => '111.0.1.2';
		Download.getFile = async () => {
			throw new Error('the manifest must not be downloaded when the local binary answers');
		};

		assert.strictEqual(await util.getChromiumVersion('9.9.9'), '111.0.1.2');
	});

	it('falls back to ThirdPartyNotices when the manifest download fails', async () => {
		const util = makeUtil();
		util.getExistingCodeVersion = () => {
			throw new Error('no local install');
		};
		Download.getFile = async () => {
			throw new Error('network unreachable');
		};
		await fs.outputFile(
			path.join(util.codeFolder, 'resources', 'app', 'ThirdPartyNotices.txt'),
			'This project incorporates chromium version 123.0.6312.4 (https://chromium.googlesource.com)\n',
		);

		assert.strictEqual(await util.getChromiumVersion('9.9.9'), '123.0.6312.4');
	});

	it('resolves the manifest registration by name instead of by position', async () => {
		const util = makeUtil();
		util.getExistingCodeVersion = () => {
			throw new Error('no local install');
		};
		Download.getFile = async (_uri: string, destination: string) => {
			await fs.outputJSON(destination, {
				registrations: [
					{ component: { git: { name: 'electron' } }, version: '42.8.1' },
					{ component: { git: { name: 'chromium' } }, version: '148.0.7778.280' },
				],
			});
		};

		assert.strictEqual(await util.getChromiumVersion('9.9.9'), '148.0.7778.280');
	});

	it('reads the Chromium version from an executable via ELECTRON_RUN_AS_NODE', function () {
		if (process.platform === 'win32') {
			this.skip();
		}
		const util = makeUtil();
		const fakeBinary = path.join(storage, 'fake-code');
		fs.outputFileSync(fakeBinary, '#!/bin/sh\necho 138.0.7204.183\n');
		fs.chmodSync(fakeBinary, 0o755);
		util.getExecutablePath = () => fakeBinary;

		assert.strictEqual(util.getChromiumVersionFromBinary(), '138.0.7204.183');
	});

	it('returns undefined when the executable does not expose a Chromium version', function () {
		if (process.platform === 'win32') {
			this.skip();
		}
		const util = makeUtil();
		// plain node prints "undefined" for process.versions.chrome
		util.getExecutablePath = () => process.execPath;

		assert.strictEqual(util.getChromiumVersionFromBinary(), undefined);
	});
});
