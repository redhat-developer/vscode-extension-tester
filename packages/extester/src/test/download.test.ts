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
import * as http from 'http';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs-extra';
import { AddressInfo } from 'net';
import { Download } from '../util/download';

describe('Download.getFile', function () {
	// got's exponential backoff makes the first retry fire after ~1s
	this.timeout(20000);

	let server: http.Server;
	let baseUrl: string;
	let requestCount: number;
	let handler: (req: http.IncomingMessage, res: http.ServerResponse) => void;
	let workDir: string;

	const FULL_BODY = Buffer.from('0123456789'.repeat(1000));

	beforeEach(async () => {
		requestCount = 0;
		server = http.createServer((req, res) => {
			requestCount++;
			handler(req, res);
		});
		await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
		baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
		workDir = await fs.mkdtemp(path.join(os.tmpdir(), 'extest-download-test-'));
	});

	afterEach(async () => {
		await new Promise<void>((resolve) => server.close(() => resolve()));
		await fs.remove(workDir);
	});

	it('downloads a file to the destination', async () => {
		handler = (_req, res) => {
			res.writeHead(200, { 'Content-Length': FULL_BODY.length });
			res.end(FULL_BODY);
		};
		const destination = path.join(workDir, 'ok.bin');

		await Download.getFile(`${baseUrl}/ok.bin`, destination);

		assert.ok(Buffer.compare(await fs.readFile(destination), FULL_BODY) === 0, 'downloaded content differs from served content');
	});

	it('retries an interrupted download and writes the complete file', async () => {
		handler = (_req, res) => {
			if (requestCount === 1) {
				// advertise the full length but cut the connection halfway through
				res.writeHead(200, { 'Content-Length': FULL_BODY.length });
				res.write(FULL_BODY.subarray(0, FULL_BODY.length / 2));
				res.destroy();
			} else {
				res.writeHead(200, { 'Content-Length': FULL_BODY.length });
				res.end(FULL_BODY);
			}
		};
		const destination = path.join(workDir, 'retried.bin');

		await Download.getFile(`${baseUrl}/retried.bin`, destination);

		assert.strictEqual(requestCount, 2, 'expected the interrupted download to be retried exactly once');
		assert.ok(Buffer.compare(await fs.readFile(destination), FULL_BODY) === 0, 'file content after retry differs from served content');
	});

	it('rejects on a non-retriable error and leaves no partial files behind', async () => {
		handler = (_req, res) => {
			res.writeHead(404);
			res.end('not here');
		};
		const destination = path.join(workDir, 'missing.bin');

		await assert.rejects(Download.getFile(`${baseUrl}/missing.bin`, destination));

		assert.strictEqual(requestCount, 1, '404 must not be retried');
		assert.ok(!(await fs.pathExists(destination)), 'destination must not exist after a failed download');
		assert.ok(!(await fs.pathExists(`${destination}.tmp`)), 'temp file must be cleaned up after a failed download');
	});
});
