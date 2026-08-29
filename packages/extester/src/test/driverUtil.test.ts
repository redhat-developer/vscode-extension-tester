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
import { logging } from 'selenium-webdriver';
import { DriverUtil } from '../util/driverUtil';
import { Download } from '../util/download';

describe('DriverUtil.chromeDriverLogLevelArgs', () => {
	it('maps INFO to --log-level=INFO with readable timestamps', () => {
		assert.deepStrictEqual(DriverUtil.chromeDriverLogLevelArgs(logging.Level.INFO), ['--log-level=INFO', '--readable-timestamp']);
	});

	it('maps DEBUG to --log-level=DEBUG', () => {
		assert.deepStrictEqual(DriverUtil.chromeDriverLogLevelArgs(logging.Level.DEBUG), ['--log-level=DEBUG', '--readable-timestamp']);
	});

	it('maps WARNING and SEVERE to their chromedriver levels', () => {
		assert.deepStrictEqual(DriverUtil.chromeDriverLogLevelArgs(logging.Level.WARNING), ['--log-level=WARNING', '--readable-timestamp']);
		assert.deepStrictEqual(DriverUtil.chromeDriverLogLevelArgs(logging.Level.SEVERE), ['--log-level=SEVERE', '--readable-timestamp']);
	});

	it('maps ALL and the FINE levels to --log-level=ALL (full CDP traffic)', () => {
		for (const level of [logging.Level.ALL, logging.Level.FINE, logging.Level.FINER, logging.Level.FINEST]) {
			assert.deepStrictEqual(DriverUtil.chromeDriverLogLevelArgs(level), ['--log-level=ALL', '--readable-timestamp']);
		}
	});

	it('maps OFF to --log-level=OFF', () => {
		assert.deepStrictEqual(DriverUtil.chromeDriverLogLevelArgs(logging.Level.OFF), ['--log-level=OFF', '--readable-timestamp']);
	});

	it('accepts the level name string exactly as the CLI passes it', () => {
		// the --log_level option hands the value over as a mixed-case string
		assert.deepStrictEqual(DriverUtil.chromeDriverLogLevelArgs('Info'), ['--log-level=INFO', '--readable-timestamp']);
		assert.deepStrictEqual(DriverUtil.chromeDriverLogLevelArgs('Off'), ['--log-level=OFF', '--readable-timestamp']);
		assert.deepStrictEqual(DriverUtil.chromeDriverLogLevelArgs('All'), ['--log-level=ALL', '--readable-timestamp']);
	});

	it('falls back to INFO for unknown level names instead of ALL', () => {
		// selenium's logging.getLevel silently returns ALL for unknown names,
		// which must not translate into full CDP wire logging by accident
		assert.deepStrictEqual(DriverUtil.chromeDriverLogLevelArgs('NotALevel'), ['--log-level=INFO', '--readable-timestamp']);
	});
});

describe('DriverUtil.findChromeDriverBinary', () => {
	const binary = process.platform === 'win32' ? 'chromedriver.exe' : 'chromedriver';
	let storage: string;

	beforeEach(async () => {
		storage = await fs.mkdtemp(path.join(os.tmpdir(), 'extest-driver-test-'));
	});

	afterEach(async () => {
		await fs.remove(storage);
	});

	function nestedPath(): string {
		return path.join(storage, `chromedriver-${DriverUtil.getChromeDriverPlatform()}`, binary);
	}

	it('returns the Chrome-for-Testing nested layout when present', async () => {
		await fs.outputFile(nestedPath(), '');
		assert.strictEqual(DriverUtil.findChromeDriverBinary(storage), nestedPath());
	});

	it('falls back to the flat legacy layout', async () => {
		await fs.outputFile(path.join(storage, binary), '');
		assert.strictEqual(DriverUtil.findChromeDriverBinary(storage), path.join(storage, binary));
	});

	it('prefers the nested layout when both exist', async () => {
		await fs.outputFile(nestedPath(), '');
		await fs.outputFile(path.join(storage, binary), '');
		assert.strictEqual(DriverUtil.findChromeDriverBinary(storage), nestedPath());
	});

	it('throws an error naming both candidate paths when no binary exists', () => {
		assert.throws(
			() => DriverUtil.findChromeDriverBinary(storage),
			(err: Error) => err.message.includes(nestedPath()) && err.message.includes(path.join(storage, binary)),
		);
	});
});

describe('DriverUtil ChromeDriver version resolution', () => {
	type VersionResolver = { getChromeDriverVersion(chromiumVersion: string): Promise<string> };
	const originalCheckURL = Download.checkURL;
	const originalGetText = Download.getText;
	const originalGetFile = Download.getFile;
	let storage: string;
	let requestedUrls: string[];

	beforeEach(async () => {
		storage = await fs.mkdtemp(path.join(os.tmpdir(), 'extest-driver-test-'));
		requestedUrls = [];
	});

	afterEach(async () => {
		Download.checkURL = originalCheckURL;
		Download.getText = originalGetText;
		Download.getFile = originalGetFile;
		await fs.remove(storage);
	});

	function resolver(): VersionResolver {
		return new DriverUtil(storage) as unknown as VersionResolver;
	}

	it('uses the exact Chromium version when Chrome for Testing hosts it', async () => {
		Download.checkURL = async (url: string) => {
			requestedUrls.push(url);
		};

		const version = await resolver().getChromeDriverVersion('148.0.7778.280');

		assert.strictEqual(version, '148.0.7778.280');
		assert.ok(requestedUrls[0].includes('/148.0.7778.280/'), `exact URL not probed: ${requestedUrls[0]}`);
	});

	it('falls back to the build-level LATEST_RELEASE when the exact version is missing', async () => {
		Download.checkURL = async () => {
			throw new Error('404');
		};
		Download.getText = async (url: string) => {
			requestedUrls.push(url);
			if (url.endsWith('LATEST_RELEASE_148.0.7778')) {
				return '148.0.7778.178\n';
			}
			throw new Error(`unexpected url ${url}`);
		};
		Download.getFile = async () => {
			throw new Error('getFile must not be used for Chrome-for-Testing version resolution');
		};

		const version = await resolver().getChromeDriverVersion('148.0.7778.280');

		assert.strictEqual(version, '148.0.7778.178');
	});

	it('falls back to the milestone-level LATEST_RELEASE when the build-level lookup fails', async () => {
		Download.checkURL = async () => {
			throw new Error('404');
		};
		Download.getText = async (url: string) => {
			requestedUrls.push(url);
			if (url.endsWith('LATEST_RELEASE_148.0.7778')) {
				throw new Error('404');
			}
			if (url.endsWith('LATEST_RELEASE_148')) {
				return '148.0.7778.178';
			}
			throw new Error(`unexpected url ${url}`);
		};
		Download.getFile = async () => {
			throw new Error('getFile must not be used for Chrome-for-Testing version resolution');
		};

		const version = await resolver().getChromeDriverVersion('148.0.7778.280');

		assert.strictEqual(version, '148.0.7778.178');
		assert.ok(
			requestedUrls.some((u) => u.endsWith('LATEST_RELEASE_148.0.7778')),
			'build-level endpoint must be tried before the milestone-level one',
		);
	});
});
