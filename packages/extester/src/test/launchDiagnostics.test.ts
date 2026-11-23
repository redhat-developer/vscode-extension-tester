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
import {
	browserLaunchEnvironment,
	detectLaunchProblems,
	extractBrowserOutput,
	findLatestMainLog,
	formatLaunchFailure,
	isSessionNotCreated,
	listNewFiles,
} from '../util/launchDiagnostics';

const ts = (n: number) => `[11-21-2026 16:23:06.35${n}000][INFO]:`;

// shaped after a real ChromeDriver 147 log written with --readable-timestamp
const LOG = [
	`${ts(1)} Starting ChromeDriver 147.0.7727.24 on port 33771`,
	`${ts(2)} [abc] COMMAND InitSession {`,
	'   "capabilities": {',
	'      "alwaysMatch": {}',
	'   }',
	'}',
	`${ts(3)} Launching chrome: /old/Code --user-data-dir=/x`,
	'output of an earlier launch',
	`${ts(4)} Populating Local State file: {`,
	'   "background_mode": {',
	'      "enabled": false',
	'   }',
	'}',
	`${ts(5)} Launching chrome: /path/Code --no-sandbox --user-data-dir=/x`,
	'[main] Sending env to running instance...',
	'',
	`${ts(6)} Populating Preferences file: {`,
	'   "enabled": false',
	'}',
	'node: bad option: --allow-pre-commit-input',
	`${ts(7)} [abc] RESPONSE InitSession ERROR session not created: Chrome instance exited.`,
	'Stacktrace:',
	'#0 0x5581d1b0c6aa <unknown>',
].join('\n');

describe('launchDiagnostics.extractBrowserOutput', () => {
	it('returns only browser lines from the last launch, skipping driver entries, JSON payloads and stack traces', () => {
		assert.deepStrictEqual(extractBrowserOutput(LOG), ['[main] Sending env to running instance...', 'node: bad option: --allow-pre-commit-input']);
	});

	it('handles CRLF line endings (Windows)', () => {
		assert.deepStrictEqual(extractBrowserOutput(LOG.replace(/\n/g, '\r\n')), [
			'[main] Sending env to running instance...',
			'node: bad option: --allow-pre-commit-input',
		]);
	});

	it('returns nothing when the log has no launch entry', () => {
		assert.deepStrictEqual(extractBrowserOutput(`${ts(1)} Starting ChromeDriver\nsomething`), []);
	});

	it('keeps only the last maxLines lines', () => {
		const many = `${ts(1)} Launching chrome: /Code\n` + Array.from({ length: 10 }, (_, i) => `line ${i}`).join('\n');
		assert.deepStrictEqual(extractBrowserOutput(many, 3), ['line 7', 'line 8', 'line 9']);
	});
});

describe('launchDiagnostics.browserLaunchEnvironment', () => {
	it('drops Electron variables that break a browser launch, case-insensitively', () => {
		const env = browserLaunchEnvironment({ PATH: '/bin', ELECTRON_RUN_AS_NODE: '1', electron_no_attach_console: '1', HOME: '/h', EMPTY: undefined });
		assert.deepStrictEqual(env, { PATH: '/bin', HOME: '/h' });
	});

	it('does not modify the source environment', () => {
		const source = { ELECTRON_RUN_AS_NODE: '1' };
		browserLaunchEnvironment(source);
		assert.strictEqual(source.ELECTRON_RUN_AS_NODE, '1');
	});
});

describe('launchDiagnostics.isSessionNotCreated', () => {
	it('recognises the selenium error by name or message', () => {
		const named = new Error('x');
		named.name = 'SessionNotCreatedError';
		assert.ok(isSessionNotCreated(named));
		assert.ok(isSessionNotCreated(new Error('session not created: Chrome failed to start: crashed.')));
	});

	it('ignores other errors and non-errors', () => {
		assert.ok(!isSessionNotCreated(new Error('No ChromeDriver binary found')));
		assert.ok(!isSessionNotCreated('session not created'));
	});
});

describe('launchDiagnostics file helpers', () => {
	let root: string;

	beforeEach(() => {
		root = fs.mkdtempSync(path.join(os.tmpdir(), 'extester-launch-'));
	});

	afterEach(() => {
		fs.removeSync(root);
	});

	const write = (file: string, content: string, mtimeMs: number) => {
		fs.outputFileSync(file, content);
		fs.utimesSync(file, mtimeMs / 1000, mtimeMs / 1000);
	};

	it('findLatestMainLog picks the newest main.log written since the launch', () => {
		const now = Date.now();
		write(path.join(root, 'logs', '20260101T000000', 'main.log'), 'old', now - 60_000);
		write(path.join(root, 'logs', '20260101T000100', 'main.log'), 'new', now + 1_000);
		fs.mkdirpSync(path.join(root, 'logs', 'no-main-log'));
		assert.strictEqual(findLatestMainLog(root, now), path.join(root, 'logs', '20260101T000100', 'main.log'));
		assert.strictEqual(findLatestMainLog(root, now + 10_000), undefined);
		assert.strictEqual(findLatestMainLog(path.join(root, 'missing'), now), undefined);
	});

	it('listNewFiles finds files written since the launch, recursively', () => {
		const now = Date.now();
		write(path.join(root, 'old.dmp'), '', now - 60_000);
		write(path.join(root, 'pending', 'new.dmp'), '', now + 1_000);
		assert.deepStrictEqual(listNewFiles(root, now), [path.join(root, 'pending', 'new.dmp')]);
		assert.deepStrictEqual(listNewFiles(path.join(root, 'missing'), now), []);
	});

	const context = (platform: NodeJS.Platform) => ({
		error: new Error('session not created: Chrome failed to start: crashed.\n  (chrome not reachable)'),
		codePath: '/path/Code',
		chromeDriverLog: path.join(root, 'chromedriver.log'),
		userDataDir: path.join(root, 'settings'),
		crashesDir: path.join(root, 'crashes'),
		launchStartedMs: Date.now() - 1_000,
		platform,
		env: { DISPLAY: ':99' } as NodeJS.ProcessEnv,
	});

	it('formatLaunchFailure includes VS Code output, main log tail, crash dumps and causes', () => {
		fs.writeFileSync(path.join(root, 'chromedriver.log'), LOG);
		fs.outputFileSync(path.join(root, 'settings', 'logs', 's1', 'main.log'), 'line a\n\nline b\n');
		fs.outputFileSync(path.join(root, 'crashes', 'reports', 'a.dmp'), '');
		const message = formatLaunchFailure(context('linux'));
		assert.match(message, /ChromeDriver reported: session not created: Chrome failed to start: crashed\.\n/);
		assert.match(message, /VS Code output \(from .*chromedriver\.log\):\n {2}\[main\] Sending env to running instance\.\.\.\n {2}node: bad option/);
		assert.match(message, /VS Code main log \(.*main\.log\):\n {2}line a\n {2}line b/);
		assert.match(message, /Crash dumps written during launch:\n {2}.*a\.dmp/);
		assert.match(message, /Common causes:/);
		assert.doesNotMatch(message, /on Windows/);
		assert.doesNotMatch(message, /Detected:/);
	});

	it('formatLaunchFailure explains the Windows "crashed" wording and copes with a missing log', () => {
		const message = formatLaunchFailure(context('win32'));
		assert.match(message, /on Windows ChromeDriver reports almost any non-zero exit code as "crashed"/);
		assert.match(message, /VS Code printed nothing before exiting/);
		assert.match(message, /Visual C\+\+ runtime/);
		assert.doesNotMatch(message, /main log|Crash dumps/);
	});

	it('formatLaunchFailure points at a missing display and the misleading "user data directory" wording (#1840)', () => {
		const error = new Error(
			"session not created: probably user data directory is already in use, please specify a unique value for --user-data-dir argument, or don't use --user-data-dir",
		);
		const message = formatLaunchFailure({ ...context('linux'), error, env: {} as NodeJS.ProcessEnv });
		assert.match(message, /Detected:\n {2}- Neither DISPLAY nor WAYLAND_DISPLAY is set.*xvfb-run/);
		assert.match(message, /\n {2}- ChromeDriver says the user data directory is "already in use"/);
	});
});

describe('launchDiagnostics.detectLaunchProblems', () => {
	const exited = 'session not created: Chrome instance exited.';

	it('reports a missing display only on Linux', () => {
		assert.strictEqual(detectLaunchProblems(exited, 'linux', {} as NodeJS.ProcessEnv).length, 1);
		assert.deepStrictEqual(detectLaunchProblems(exited, 'linux', { DISPLAY: ':99' } as NodeJS.ProcessEnv), []);
		assert.deepStrictEqual(detectLaunchProblems(exited, 'linux', { WAYLAND_DISPLAY: 'wayland-0' } as NodeJS.ProcessEnv), []);
		assert.deepStrictEqual(detectLaunchProblems(exited, 'darwin', {} as NodeJS.ProcessEnv), []);
		assert.deepStrictEqual(detectLaunchProblems(exited, 'win32', {} as NodeJS.ProcessEnv), []);
	});

	it('explains the "user data directory is already in use" wording on any platform', () => {
		const problems = detectLaunchProblems('session not created: probably user data directory is already in use', 'darwin', {} as NodeJS.ProcessEnv);
		assert.strictEqual(problems.length, 1);
		assert.match(problems[0], /reports that for any VS Code exit during launch/);
	});
});
