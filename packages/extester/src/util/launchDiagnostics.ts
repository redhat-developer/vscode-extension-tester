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

import * as path from 'node:path';
import * as fs from 'fs-extra';

/**
 * Diagnostics for a VS Code instance that dies before ChromeDriver can attach.
 *
 * Every such early exit — a rejected argument, a single-instance handoff to a
 * leftover VS Code, a native crash — reaches the user as the same opaque
 * "session not created: Chrome instance exited" (or, on Windows, "Chrome failed
 * to start: crashed", because Chromium reports any unrecognised non-zero exit
 * code there as a crash). The helpers below collect what VS Code itself left
 * behind so the error can say why.
 */

/**
 * Environment variables that turn the Electron binary into something other
 * than a browser. `ELECTRON_RUN_AS_NODE` makes Code.exe run as plain Node,
 * which rejects ChromeDriver's Chromium switches and exits immediately;
 * `ELECTRON_NO_ATTACH_CONSOLE` detaches the Windows console and swallows the
 * startup output the diagnostics rely on. Both leak in when tests are started
 * from a process spawned by another Electron/VS Code host.
 */
export const ELECTRON_LAUNCH_BLOCKING_ENV = ['ELECTRON_RUN_AS_NODE', 'ELECTRON_NO_ATTACH_CONSOLE'];

/**
 * Copy of `env` without variables that break launching VS Code as a browser.
 * Matching is case-insensitive because Windows environment names are.
 */
export function browserLaunchEnvironment(env: NodeJS.ProcessEnv): Record<string, string> {
	const blocked = new Set(ELECTRON_LAUNCH_BLOCKING_ENV);
	const result: Record<string, string> = {};
	for (const [key, value] of Object.entries(env)) {
		if (value !== undefined && !blocked.has(key.toUpperCase())) {
			result[key] = value;
		}
	}
	return result;
}

/** True for the selenium error ChromeDriver returns when the browser never came up. */
export function isSessionNotCreated(err: unknown): boolean {
	if (!(err instanceof Error)) {
		return false;
	}
	return err.name === 'SessionNotCreatedError' || /session not created/i.test(err.message);
}

// ChromeDriver's own entries carry --readable-timestamp's prefix, e.g.
// "[11-21-2026 16:23:06.354831][INFO]: ..."
const DRIVER_LINE = /^\[\d{2}-\d{2}-\d{4} \d{2}:\d{2}:\d{2}\.\d+\]\[[A-Z]+\]:/;
const LAUNCH_LINE = /\]: Launching chrome: /;
// native stack trace ChromeDriver appends to some errors
const DRIVER_STACK_LINE = /^(Stacktrace:|#\d+ 0x|\s*\(No symbol\))/;

/**
 * Extract what the browser process itself printed during its last launch from
 * a ChromeDriver log written with --enable-chrome-logs: everything after the
 * last "Launching chrome:" entry that is not ChromeDriver's own output.
 *
 * @param logText ChromeDriver log contents
 * @param maxLines keep only the last maxLines lines of browser output
 */
export function extractBrowserOutput(logText: string, maxLines: number = 40): string[] {
	const lines = logText.split(/\r?\n/);
	let start = -1;
	for (let i = lines.length - 1; i >= 0; i--) {
		if (DRIVER_LINE.test(lines[i]) && LAUNCH_LINE.test(lines[i])) {
			start = i + 1;
			break;
		}
	}
	if (start < 0) {
		return [];
	}
	const output: string[] = [];
	// ChromeDriver pretty-prints JSON payloads over several lines after an
	// entry ending in "{" or "["; skip them until the closing bracket at column 0.
	let jsonCloser: string | undefined;
	for (const line of lines.slice(start)) {
		if (jsonCloser) {
			if (line === jsonCloser) {
				jsonCloser = undefined;
			}
			continue;
		}
		if (DRIVER_LINE.test(line)) {
			const trimmed = line.trimEnd();
			if (trimmed.endsWith('{')) {
				jsonCloser = '}';
			} else if (trimmed.endsWith('[')) {
				jsonCloser = ']';
			}
			continue;
		}
		if (DRIVER_STACK_LINE.test(line) || line.trim() === '') {
			continue;
		}
		output.push(line);
	}
	return output.slice(-maxLines);
}

/**
 * Newest VS Code main-process log (`<user-data-dir>/logs/<session>/main.log`)
 * written at or after `sinceMs`, or undefined when VS Code did not get that far.
 */
export function findLatestMainLog(userDataDir: string, sinceMs: number): string | undefined {
	const logsDir = path.join(userDataDir, 'logs');
	if (!fs.existsSync(logsDir)) {
		return undefined;
	}
	let latest: { file: string; mtime: number } | undefined;
	for (const session of fs.readdirSync(logsDir)) {
		const file = path.join(logsDir, session, 'main.log');
		try {
			const mtime = fs.statSync(file).mtimeMs;
			if (mtime >= sinceMs && (!latest || mtime > latest.mtime)) {
				latest = { file, mtime };
			}
		} catch {
			// session without a main.log
		}
	}
	return latest?.file;
}

/** Files under `dir` (recursively) modified at or after `sinceMs`. */
export function listNewFiles(dir: string, sinceMs: number): string[] {
	if (!fs.existsSync(dir)) {
		return [];
	}
	const found: string[] = [];
	const walk = (current: string) => {
		for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
			const full = path.join(current, entry.name);
			if (entry.isDirectory()) {
				walk(full);
			} else if (entry.isFile() && fs.statSync(full).mtimeMs >= sinceMs) {
				found.push(full);
			}
		}
	};
	walk(dir);
	return found.sort();
}

function tail(file: string, maxLines: number): string[] {
	try {
		const lines = fs
			.readFileSync(file, 'utf-8')
			.split(/\r?\n/)
			.filter((line) => line.trim() !== '');
		return lines.slice(-maxLines);
	} catch {
		return [];
	}
}

export interface LaunchFailureContext {
	/** the selenium error ChromeDriver returned */
	error: Error;
	/** path of the VS Code binary ChromeDriver launched */
	codePath: string;
	/** ChromeDriver log file (written with --enable-chrome-logs) */
	chromeDriverLog: string;
	/** the --user-data-dir VS Code was launched with */
	userDataDir: string;
	/** the --crash-reporter-directory VS Code was launched with */
	crashesDir: string;
	/** epoch ms just before the launch, to ignore artifacts of earlier runs */
	launchStartedMs: number;
	platform?: NodeJS.Platform;
}

/**
 * Build the message for a VS Code instance that exited before ChromeDriver
 * could attach: the original error, VS Code's own startup output, its main
 * log, new crash dumps, and the usual causes.
 */
export function formatLaunchFailure(ctx: LaunchFailureContext): string {
	const platform = ctx.platform ?? process.platform;
	const sections: string[] = [
		`VS Code exited during launch, before ChromeDriver could connect to it.`,
		`ChromeDriver reported: ${ctx.error.message.split('\n')[0]}`,
	];
	if (platform === 'win32') {
		sections.push(
			`Note: on Windows ChromeDriver reports almost any non-zero exit code as "crashed"; this usually means VS Code refused to start, not that it hit a native crash.`,
		);
	}

	let browserOutput: string[] = [];
	try {
		browserOutput = extractBrowserOutput(fs.readFileSync(ctx.chromeDriverLog, 'utf-8'));
	} catch {
		// log missing or unreadable — fall through to the other sources
	}
	if (browserOutput.length > 0) {
		sections.push(`VS Code output (from ${ctx.chromeDriverLog}):\n${browserOutput.map((line) => `  ${line}`).join('\n')}`);
	} else {
		sections.push(`VS Code printed nothing before exiting. Full ChromeDriver log: ${ctx.chromeDriverLog}`);
	}

	const mainLog = findLatestMainLog(ctx.userDataDir, ctx.launchStartedMs);
	if (mainLog) {
		const lines = tail(mainLog, 20);
		if (lines.length > 0) {
			sections.push(`VS Code main log (${mainLog}):\n${lines.map((line) => `  ${line}`).join('\n')}`);
		}
	}

	const dumps = listNewFiles(ctx.crashesDir, ctx.launchStartedMs);
	if (dumps.length > 0) {
		sections.push(`Crash dumps written during launch:\n${dumps.map((dump) => `  ${dump}`).join('\n')}`);
	}

	sections.push(
		[
			'Common causes:',
			'  - a VS Code instance from a previous run is still using the same storage folder; close leftover Code/ChromeDriver processes',
			`  - the VS Code binary is missing, incomplete or blocked (antivirus, missing execute permission): ${ctx.codePath}`,
			platform === 'win32'
				? '  - the runner has no interactive desktop session or GPU and is missing the Visual C++ runtime that VS Code needs'
				: '  - required system libraries or a display (e.g. Xvfb on headless Linux) are missing',
			`  - the exact launch command is in the ChromeDriver log: ${ctx.chromeDriverLog}`,
		].join('\n'),
	);
	return sections.join('\n\n');
}
