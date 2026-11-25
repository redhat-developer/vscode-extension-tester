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

import { strict as assert } from 'node:assert';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { createConnection } from 'node:net';
import * as path from 'node:path';
import { DEFAULT_SCREEN, isWaylandSession, parseScreen, quoteForShell, VirtualDisplay, withoutWayland } from '../../utils/virtualDisplay';

/**
 * Opens an X11 connection to a local display, with the cookie of an Xauthority file or without one,
 * and reports whether the server accepted it. The first byte of the server's reply is 1 on success.
 */
function connectsToDisplay(display: string, xauthority?: string): Promise<boolean> {
	let name: Buffer = Buffer.alloc(0);
	let data: Buffer = Buffer.alloc(0);
	if (xauthority) {
		// Our files hold one entry: family, address, number, name, data, each with a 16-bit length.
		const file = readFileSync(xauthority);
		let offset = 2;
		const fields: Buffer[] = [];
		for (let i = 0; i < 4; i++) {
			const length = file.readUInt16BE(offset);
			fields.push(file.subarray(offset + 2, offset + 2 + length));
			offset += 2 + length;
		}
		[, , name, data] = fields;
	}
	const pad = (buffer: Buffer) => Buffer.concat([buffer, Buffer.alloc((4 - (buffer.length % 4)) % 4)]);
	const header = Buffer.alloc(12);
	header.write('l', 0);
	header.writeUInt16LE(11, 2);
	header.writeUInt16LE(0, 4);
	header.writeUInt16LE(name.length, 6);
	header.writeUInt16LE(data.length, 8);
	return new Promise((resolve, reject) => {
		const socket = createConnection(`/tmp/.X11-unix/X${display.slice(1)}`);
		socket.once('error', reject);
		socket.once('connect', () => socket.write(Buffer.concat([header, pad(name), pad(data)])));
		socket.once('data', (reply: Buffer) => {
			socket.destroy();
			resolve(reply[0] === 1);
		});
	});
}

/** The process id of the Xvfb that uses an Xauthority file, found by its `-auth` argument. */
function serverPid(xauthority: string): number {
	const pids = spawnSync('pgrep', ['-f', '--', `-auth ${xauthority}`], { encoding: 'utf8' })
		.stdout.trim()
		.split('\n')
		.filter(Boolean);
	assert.equal(pids.length, 1, `one Xvfb uses ${xauthority}`);
	return Number(pids[0]);
}

/** Process ids of the Xvfb servers that the Runner started, found by their cookie folder. */
function runningServers(): string[] {
	return spawnSync('pgrep', ['-f', '--', '-auth .*extester-runner-xvfb-'], { encoding: 'utf8' }).stdout.trim().split('\n').filter(Boolean);
}

/** Whether a process is still running. */
function isAlive(pid: number): boolean {
	try {
		process.kill(pid, 0);
		return true;
	} catch {
		return false;
	}
}

/** Waits until a process has exited. */
async function waitForExit(pid: number): Promise<void> {
	for (let i = 0; i < 50 && isAlive(pid); i++) {
		await new Promise((resolve) => setTimeout(resolve, 100));
	}
	assert.ok(!isAlive(pid), `process ${pid} is still running`);
}

/** Whether Xvfb can be started here: Linux with Xvfb installed, as on the Ubuntu CI runners. */
function hasXvfb(): boolean {
	return process.platform === 'linux' && spawnSync('sh', ['-c', 'command -v Xvfb'], { stdio: 'ignore' }).status === 0;
}

describe('Virtual display', () => {
	describe('screen', () => {
		it('uses the default screen when none is set', () => {
			assert.equal(parseScreen(undefined), DEFAULT_SCREEN);
			assert.equal(parseScreen('  '), DEFAULT_SCREEN);
		});

		it('adds a 24-bit depth when the depth is missing', () => {
			assert.equal(parseScreen('1280x1024'), '1280x1024x24');
			assert.equal(parseScreen(' 2560x1440x16 '), '2560x1440x16');
		});

		it('rejects an invalid screen', () => {
			assert.throws(() => parseScreen('1920*1080'), /Invalid virtual display screen "1920\*1080"/);
			assert.throws(() => parseScreen('1920x1080x12'), /Invalid virtual display screen/);
		});
	});

	describe('Wayland', () => {
		it('keeps the command when no Wayland display is set', () => {
			assert.equal(withoutWayland("npx extest setup-and-run 'out/*.test.js'", { DISPLAY: ':0' }), "npx extest setup-and-run 'out/*.test.js'");
		});

		it('removes WAYLAND_DISPLAY for the whole command and keeps the task shell', () => {
			assert.equal(
				withoutWayland("npm run build && npm run ui-test -- 'out/a b.test.js'", { WAYLAND_DISPLAY: 'wayland-0' }, '/usr/bin/zsh'),
				`env -u WAYLAND_DISPLAY XDG_SESSION_TYPE=x11 '/usr/bin/zsh' -c 'npm run build && npm run ui-test -- '\\''out/a b.test.js'\\'''`,
			);
		});

		it('falls back to $SHELL, then /bin/sh', () => {
			assert.ok(withoutWayland('true', { WAYLAND_DISPLAY: 'wayland-0', SHELL: '/bin/bash' }).includes(" '/bin/bash' -c "));
			assert.ok(withoutWayland('true', { WAYLAND_DISPLAY: 'wayland-0' }).includes(" '/bin/sh' -c "));
		});

		it('detects a Wayland session by XDG_SESSION_TYPE too', () => {
			assert.ok(isWaylandSession({ XDG_SESSION_TYPE: 'wayland' }));
			assert.ok(isWaylandSession({ WAYLAND_DISPLAY: 'wayland-1' }));
			assert.ok(!isWaylandSession({ XDG_SESSION_TYPE: 'x11', DISPLAY: ':0' }));
		});

		it('runs a bash-only command unchanged in bash', function () {
			if (process.platform === 'win32' || spawnSync('sh', ['-c', 'command -v bash'], { stdio: 'ignore' }).status !== 0) {
				this.skip();
			}
			const line = withoutWayland('source /dev/null && [[ -n x ]] && echo ok', { WAYLAND_DISPLAY: 'wayland-0' }, 'bash');
			assert.equal(execFileSync('sh', ['-c', line], { env: { ...process.env, WAYLAND_DISPLAY: 'wayland-0' } }).toString(), 'ok\n');
		});

		it('quotes a command line as one shell word', function () {
			if (process.platform === 'win32') {
				this.skip();
			}
			const line = `printf '%s|' "it's" '$HOME' a\\ b`;
			assert.equal(execFileSync('sh', ['-c', `sh -c ${quoteForShell(line)}`]).toString(), "it's|$HOME|a b|");
		});
	});

	describe('Xvfb', function () {
		this.timeout(30_000);
		let display: VirtualDisplay;

		before(function () {
			if (!hasXvfb()) {
				this.skip();
			}
		});

		beforeEach(() => (display = new VirtualDisplay()));
		afterEach(() => display.dispose());

		it('starts a display and reuses it for the next run', async () => {
			const first = await display.acquire('1024x768x24');
			assert.match(first.display, /^:\d+$/);
			assert.deepEqual(await display.acquire('1024x768x24'), first);
		});

		it('accepts only clients with its cookie', async () => {
			const access = await display.acquire('1024x768x24');
			assert.equal(await connectsToDisplay(access.display, access.xauthority), true);
			assert.equal(await connectsToDisplay(access.display), false);
		});

		it('restarts the display when the screen changes', async () => {
			const first = await display.acquire('1024x768x24');
			const firstPid = serverPid(first.xauthority);
			const second = await display.acquire('800x600x24');
			assert.equal(display.display, second.display);
			await waitForExit(firstPid);
			assert.ok(!existsSync(path.dirname(first.xauthority)), 'the cookie of the first display is removed');
		});

		it('stops the display on dispose', async () => {
			const access = await display.acquire('1024x768x24');
			const pid = serverPid(access.xauthority);
			display.dispose();
			assert.equal(display.display, undefined);
			await waitForExit(pid);
		});

		it('stops a display that finishes starting after dispose', async () => {
			const starting = display.acquire('1024x768x24');
			display.dispose();
			await assert.rejects(starting, /stopped while it was starting/);
			assert.equal(display.display, undefined);
			// The server that finished starting is stopped and its cookie removed.
			for (let i = 0; i < 50 && runningServers().length > 0; i++) {
				await new Promise((resolve) => setTimeout(resolve, 100));
			}
			assert.deepEqual(runningServers(), []);
		});
	});

	it('explains how to install Xvfb when it is missing', async () => {
		await assert.rejects(new VirtualDisplay('extester-runner-no-such-xvfb').acquire(DEFAULT_SCREEN), /Xvfb is not installed/);
	});
});
