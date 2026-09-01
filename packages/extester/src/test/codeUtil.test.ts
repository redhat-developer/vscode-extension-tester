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
import { CodeUtil, overriddenDefaultKeys } from '../util/codeUtil';
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
