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
import * as tar from 'tar';
import { Unpack } from '../util/unpack';

describe('Unpack', function () {
	this.timeout(15000);

	let workDir: string;
	let srcDir: string;
	let outDir: string;

	beforeEach(async () => {
		workDir = await fs.mkdtemp(path.join(os.tmpdir(), 'extest-unpack-test-'));
		srcDir = path.join(workDir, 'src');
		outDir = path.join(workDir, 'out');
		await fs.mkdirp(srcDir);
		await fs.mkdirp(outDir);
		await fs.outputFile(path.join(srcDir, 'bin', 'launcher'), '#!/bin/sh\necho hi\n', { mode: 0o755 });
		await fs.outputFile(path.join(srcDir, 'data.txt'), 'payload');
	});

	afterEach(async () => {
		await fs.remove(workDir);
	});

	it('extracts a .tar.gz preserving content and the executable bit', async () => {
		const archive = path.join(workDir, 'fixture.tar.gz');
		await tar.c({ gzip: true, file: archive, cwd: srcDir }, ['.']);

		await Unpack.unpack(archive, outDir);

		assert.strictEqual(await fs.readFile(path.join(outDir, 'data.txt'), 'utf-8'), 'payload');
		if (process.platform !== 'win32') {
			const mode = (await fs.stat(path.join(outDir, 'bin', 'launcher'))).mode;
			assert.ok(mode & 0o111, `executable bit lost on extraction (mode ${mode.toString(8)})`);
		}
	});

	it('rejects unsupported archive extensions', async () => {
		const bogus = path.join(workDir, 'fixture.rar');
		await fs.outputFile(bogus, 'not an archive');
		await assert.rejects(Unpack.unpack(bogus, outDir), /Unsupported extension/);
	});

	it('extracts a .zip through the library path used on Windows', async function () {
		// fixture creation needs the zip CLI; the library path itself is platform-neutral
		if (process.platform === 'win32') {
			this.skip();
		}
		const { execSync } = await import('child_process');
		const archive = path.join(workDir, 'fixture.zip');
		execSync(`zip -qr "${archive}" .`, { cwd: srcDir, timeout: 30_000 });

		await Unpack.unpackZipWithLibrary(archive, outDir);

		assert.strictEqual(await fs.readFile(path.join(outDir, 'data.txt'), 'utf-8'), 'payload');
		const mode = (await fs.stat(path.join(outDir, 'bin', 'launcher'))).mode;
		assert.ok(mode & 0o111, `executable bit lost on zip extraction (mode ${mode.toString(8)})`);
	});
});
