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
import { crc32 } from 'zlib';
import { Unpack } from '../util/unpack';

/** One entry for {@link writeStoredZip}. */
interface ZipEntry {
	/** entry name exactly as stored in the archive, e.g. 'dir/file.txt' or '../escape.txt' */
	name: string;
	data: string;
	/** unix st_mode kept in the external attributes, e.g. 0o100644 for a file or 0o120777 for a symlink */
	mode?: number;
}

/**
 * Write a minimal ZIP archive (stored entries, unix external attributes) so tests
 * can craft entries the zip CLI refuses to create: `../` names and symlinks.
 */
async function writeStoredZip(file: string, entries: ZipEntry[]): Promise<void> {
	const locals: Buffer[] = [];
	const centrals: Buffer[] = [];
	let offset = 0;
	for (const entry of entries) {
		const name = Buffer.from(entry.name, 'utf8');
		const data = Buffer.from(entry.data, 'utf8');
		const crc = crc32(data);
		const mode = entry.mode ?? 0o100644;

		const local = Buffer.alloc(30);
		local.writeUInt32LE(0x04034b50, 0); // local file header signature
		local.writeUInt16LE(20, 4); // version needed to extract
		local.writeUInt16LE(0, 6); // general purpose flags
		local.writeUInt16LE(0, 8); // compression method: stored
		local.writeUInt16LE(0, 10); // last mod time
		local.writeUInt16LE(0x21, 12); // last mod date: 1980-01-01
		local.writeUInt32LE(crc, 14);
		local.writeUInt32LE(data.length, 18); // compressed size
		local.writeUInt32LE(data.length, 22); // uncompressed size
		local.writeUInt16LE(name.length, 26);
		local.writeUInt16LE(0, 28); // extra field length
		locals.push(local, name, data);

		const central = Buffer.alloc(46);
		central.writeUInt32LE(0x02014b50, 0); // central directory header signature
		central.writeUInt16LE((3 << 8) | 20, 4); // version made by: unix
		central.writeUInt16LE(20, 6); // version needed to extract
		central.writeUInt16LE(0, 8); // general purpose flags
		central.writeUInt16LE(0, 10); // compression method: stored
		central.writeUInt16LE(0, 12); // last mod time
		central.writeUInt16LE(0x21, 14); // last mod date
		central.writeUInt32LE(crc, 16);
		central.writeUInt32LE(data.length, 20); // compressed size
		central.writeUInt32LE(data.length, 24); // uncompressed size
		central.writeUInt16LE(name.length, 28);
		central.writeUInt16LE(0, 30); // extra field length
		central.writeUInt16LE(0, 32); // file comment length
		central.writeUInt16LE(0, 34); // disk number start
		central.writeUInt16LE(0, 36); // internal attributes
		central.writeUInt32LE((mode << 16) >>> 0, 38); // external attributes: unix mode in the high word
		central.writeUInt32LE(offset, 42); // local header offset
		centrals.push(central, name);

		offset += local.length + name.length + data.length;
	}
	const centralSize = centrals.reduce((sum, chunk) => sum + chunk.length, 0);
	const eocd = Buffer.alloc(22);
	eocd.writeUInt32LE(0x06054b50, 0); // end of central directory signature
	eocd.writeUInt16LE(0, 4); // this disk
	eocd.writeUInt16LE(0, 6); // central directory disk
	eocd.writeUInt16LE(entries.length, 8);
	eocd.writeUInt16LE(entries.length, 10);
	eocd.writeUInt32LE(centralSize, 12);
	eocd.writeUInt32LE(offset, 16); // central directory offset
	eocd.writeUInt16LE(0, 20); // comment length
	await fs.writeFile(file, Buffer.concat([...locals, ...centrals, eocd]));
}

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

	// The library path only runs on Windows in production (macOS/Linux shell out to
	// system unzip), so file modes are irrelevant here; what matters is that a hostile
	// archive can never write outside the destination.
	describe('zip library path (used on Windows)', () => {
		let archive: string;

		beforeEach(() => {
			archive = path.join(workDir, 'fixture.zip');
		});

		it('extracts nested entries into the destination', async () => {
			await writeStoredZip(archive, [
				{ name: 'data.txt', data: 'payload' },
				{ name: 'bin/launcher', data: '#!/bin/sh\necho hi\n', mode: 0o100755 },
			]);

			await Unpack.unpackZipWithLibrary(archive, outDir);

			assert.strictEqual(await fs.readFile(path.join(outDir, 'data.txt'), 'utf-8'), 'payload');
			assert.strictEqual(await fs.readFile(path.join(outDir, 'bin', 'launcher'), 'utf-8'), '#!/bin/sh\necho hi\n');
		});

		it('never materializes symlink entries or writes through them', async () => {
			// CVE-2026-56876 / CVE-2026-19693 pattern: a symlink entry pointing outside the
			// destination, followed by a same-named file entry that writes through it
			const outside = path.join(workDir, 'outside.txt');
			await fs.outputFile(outside, 'secret');
			await writeStoredZip(archive, [
				{ name: 'data.txt', data: 'payload' },
				{ name: 'link', data: '../outside.txt', mode: 0o120777 },
				{ name: 'link', data: 'pwned' },
			]);

			await Unpack.unpackZipWithLibrary(archive, outDir).catch(() => undefined);

			assert.strictEqual(await fs.readFile(path.join(outDir, 'data.txt'), 'utf-8'), 'payload', 'benign entry was not extracted');
			assert.strictEqual(await fs.readFile(outside, 'utf-8'), 'secret', 'file outside the destination was overwritten through a symlink');
			const link = path.join(outDir, 'link');
			if (await fs.pathExists(link)) {
				assert.ok(!(await fs.lstat(link)).isSymbolicLink(), 'symlink entry was materialized as a real symlink');
			}
		});

		it('never writes entries outside the destination', async () => {
			await writeStoredZip(archive, [
				{ name: 'data.txt', data: 'payload' },
				{ name: '../escaped.txt', data: 'pwned' },
			]);

			await Unpack.unpackZipWithLibrary(archive, outDir).catch(() => undefined);

			assert.strictEqual(await fs.readFile(path.join(outDir, 'data.txt'), 'utf-8'), 'payload', 'benign entry was not extracted');
			assert.ok(!(await fs.pathExists(path.join(workDir, 'escaped.txt'))), 'entry with ../ escaped the destination');
		});
	});
});
