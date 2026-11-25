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

import { ChildProcess, spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { Readable } from 'node:stream';

/** Screen of the virtual display when the `virtualDisplay.screen` setting is empty. */
export const DEFAULT_SCREEN = '1920x1080x24';

/** How long to wait for Xvfb to accept connections, in milliseconds. */
const START_TIMEOUT = 10_000;

/** Install hint shown when Xvfb is missing. */
const INSTALL_HINT =
	'Xvfb is not installed. Install it with your package manager, for example `sudo apt install xvfb` (Debian, Ubuntu) or `sudo dnf install xorg-x11-server-Xvfb` (Fedora).';

/**
 * Checks and normalizes the screen of the virtual display: `WIDTHxHEIGHT` or `WIDTHxHEIGHTxDEPTH`.
 * The colour depth defaults to 24 bits.
 *
 * @param {string | undefined} value - The configured screen, such as `1920x1080` or `1280x1024x24`.
 * @returns {string} The screen as Xvfb takes it, `WIDTHxHEIGHTxDEPTH`.
 */
export function parseScreen(value: string | undefined): string {
	const text = value?.trim() || DEFAULT_SCREEN;
	const match = /^(\d{2,5})x(\d{2,5})(?:x(8|16|24|30))?$/.exec(text);
	if (!match) {
		throw new Error(`Invalid virtual display screen "${text}": use WIDTHxHEIGHT or WIDTHxHEIGHTxDEPTH, for example ${DEFAULT_SCREEN}.`);
	}
	return `${match[1]}x${match[2]}x${match[3] ?? '24'}`;
}

/**
 * Quotes a command line as one POSIX shell word, so that a shell's `-c` runs it unchanged.
 * The result is also one word in bash, zsh and fish, the shells VS Code runs Linux tasks in.
 *
 * @param {string} text - The command line.
 * @returns {string} The quoted command line.
 */
export function quoteForShell(text: string): string {
	const escaped = text.replaceAll("'", String.raw`'\''`);
	return `'${escaped}'`;
}

/**
 * Whether VS Code runs in a Wayland session, where Electron prefers Wayland over the X display.
 *
 * @param {NodeJS.ProcessEnv} env - The environment VS Code starts tasks with.
 * @returns {boolean} `true` when `WAYLAND_DISPLAY` is set or `XDG_SESSION_TYPE` is `wayland`.
 */
export function isWaylandSession(env: NodeJS.ProcessEnv): boolean {
	return env.WAYLAND_DISPLAY !== undefined || env.XDG_SESSION_TYPE === 'wayland';
}

/**
 * The command line that runs a test command on an X11 display even in a Wayland session.
 *
 * Electron (and so VS Code) prefers Wayland when `WAYLAND_DISPLAY` is set, which would open the
 * window on the user's screen instead of the X display. An empty value is not enough, so the
 * variable is removed for the whole command with `env -u`. The command then runs in `shell`,
 * the shell VS Code runs tasks in, so shell-specific commands such as `source` keep working.
 *
 * @param {string} commandLine - The test command line.
 * @param {NodeJS.ProcessEnv} env - The environment VS Code starts tasks with.
 * @param {string} [shell] - The shell to run the command in; `$SHELL`, then `/bin/sh` by default.
 * @returns {string} The command line to run, unchanged outside a Wayland session.
 */
export function withoutWayland(commandLine: string, env: NodeJS.ProcessEnv, shell?: string): string {
	if (!isWaylandSession(env)) {
		return commandLine;
	}
	const runIn = shell || env.SHELL || '/bin/sh';
	return `env -u WAYLAND_DISPLAY XDG_SESSION_TYPE=x11 ${quoteForShell(runIn)} -c ${quoteForShell(commandLine)}`;
}

/**
 * Writes an Xauthority file with one MIT-MAGIC-COOKIE-1 entry. The entry is for any host
 * (FamilyWild), so it matches the local socket of the display.
 *
 * @param {string} file - The file to write, readable by the user only.
 * @param {string} displayNumber - The display number, such as `99`; Xvfb itself does not check it.
 * @param {Buffer} cookie - The 16-byte cookie.
 */
export function writeXauthority(file: string, displayNumber: string, cookie: Buffer): void {
	const field = (data: Buffer) => {
		const length = Buffer.alloc(2);
		length.writeUInt16BE(data.length);
		return Buffer.concat([length, data]);
	};
	const family = Buffer.alloc(2);
	family.writeUInt16BE(0xffff); // FamilyWild
	const entry = Buffer.concat([family, field(Buffer.alloc(0)), field(Buffer.from(displayNumber)), field(Buffer.from('MIT-MAGIC-COOKIE-1')), field(cookie)]);
	writeFileSync(file, entry, { mode: 0o600 });
}

/** A started Xvfb server. */
interface Server {
	process: ChildProcess;
	display: string;
	/** Xauthority file with the cookie that Xvfb accepts. */
	xauthority: string;
	screen: string;
	authDir: string;
}

/** What a test process needs to use the virtual display. */
export interface DisplayAccess {
	/** The `DISPLAY` value, such as `:99`. */
	display: string;
	/** The `XAUTHORITY` value: the file with the cookie that the display accepts. */
	xauthority: string;
}

/**
 * Starts Xvfb and returns its display once it accepts connections.
 * Xvfb picks a free display itself and writes its number to the `-displayfd` pipe. Like
 * `xvfb-run`, it gets a random cookie through `-auth`, so other local users cannot connect to it.
 */
function startXvfb(screen: string, command: string): Promise<Server> {
	const authDir = mkdtempSync(path.join(tmpdir(), 'extester-runner-xvfb-'));
	const xauthority = path.join(authDir, 'Xauthority');
	const cookie = randomBytes(16);
	// Xvfb loads every cookie of the file; the display number is fixed once Xvfb reports it.
	writeXauthority(xauthority, '0', cookie);
	return new Promise<Server>((resolve, reject) => {
		const xvfb = spawn(command, ['-displayfd', '3', '-screen', '0', screen, '-nolisten', 'tcp', '-auth', xauthority], {
			stdio: ['ignore', 'ignore', 'pipe', 'pipe'],
		});
		let output = '';
		let stderr = '';
		let settled = false;
		const fail = (error: Error) => {
			if (!settled) {
				settled = true;
				clearTimeout(timer);
				xvfb.kill();
				rmSync(authDir, { recursive: true, force: true });
				reject(error);
			}
		};
		const timer = setTimeout(() => fail(new Error(`Xvfb did not start within ${START_TIMEOUT / 1000} seconds.${details(stderr)}`)), START_TIMEOUT);
		xvfb.stderr?.on('data', (chunk: Buffer) => {
			// Keep the end only: Xvfb can print many harmless warnings.
			stderr = (stderr + chunk.toString()).slice(-2000);
		});
		(xvfb.stdio[3] as Readable).on('data', (chunk: Buffer) => {
			output += chunk.toString();
			const match = /^(\d+)\n/.exec(output);
			if (match && !settled) {
				try {
					writeXauthority(xauthority, match[1], cookie);
				} catch (error) {
					fail(error instanceof Error ? error : new Error(String(error)));
					return;
				}
				settled = true;
				clearTimeout(timer);
				resolve({ process: xvfb, display: `:${match[1]}`, xauthority, screen, authDir });
			}
		});
		xvfb.on('error', (error: NodeJS.ErrnoException) => fail(error.code === 'ENOENT' ? new Error(INSTALL_HINT) : error));
		xvfb.on('exit', (code, signal) => fail(new Error(`Xvfb exited (${signal ?? 'exit code ' + code}) before it was ready.${details(stderr)}`)));
	});
}

function details(stderr: string): string {
	const text = stderr.trim();
	return text ? ` Its output:\n${text}` : '';
}

function isRunning(process: ChildProcess): boolean {
	return process.exitCode === null && process.signalCode === null;
}

function stopServer(server: Server): void {
	server.process.kill();
	rmSync(server.authDir, { recursive: true, force: true });
}

/**
 * A virtual X display (Xvfb) for test runs, so that the VS Code instance under test does not open
 * on the user's screen. It is started on the first run, kept for the next runs and stopped with
 * {@link VirtualDisplay.dispose}. A run with a different screen size restarts it.
 */
export class VirtualDisplay {
	private server: Server | undefined;
	private starting: Promise<DisplayAccess> | undefined;
	/** Increased by {@link VirtualDisplay.dispose}, so a start that ends after it stops its server. */
	private generation = 0;

	/**
	 * @param {string} [command] - The Xvfb executable, `Xvfb` from the `PATH` by default.
	 */
	constructor(private readonly command = 'Xvfb') {}

	/**
	 * The `DISPLAY` value of the running virtual display, if it is running.
	 */
	get display(): string | undefined {
		return this.server?.display;
	}

	/**
	 * Starts the virtual display, or reuses it when it already runs with this screen.
	 *
	 * @param {string} screen - The screen, `WIDTHxHEIGHTxDEPTH` (see {@link parseScreen}).
	 * @returns {Promise<DisplayAccess>} The `DISPLAY` and `XAUTHORITY` values for the test process.
	 */
	async acquire(screen: string): Promise<DisplayAccess> {
		if (this.starting) {
			await this.starting.catch(() => undefined);
		}
		if (this.server?.screen === screen && isRunning(this.server.process)) {
			return { display: this.server.display, xauthority: this.server.xauthority };
		}
		this.stop();
		const generation = this.generation;
		this.starting = startXvfb(screen, this.command).then((started) => {
			if (generation !== this.generation) {
				// Disposed while Xvfb was starting, for example because VS Code is closing.
				stopServer(started);
				throw new Error('The virtual display was stopped while it was starting.');
			}
			this.server = started;
			started.process.once('exit', () => {
				if (this.server?.process === started.process) {
					this.server = undefined;
				}
			});
			return { display: started.display, xauthority: started.xauthority };
		});
		try {
			return await this.starting;
		} finally {
			this.starting = undefined;
		}
	}

	/**
	 * Stops the virtual display, if it runs, including one that is still starting.
	 */
	dispose(): void {
		this.generation++;
		this.stop();
	}

	private stop(): void {
		if (this.server) {
			stopServer(this.server);
			this.server = undefined;
		}
	}
}
