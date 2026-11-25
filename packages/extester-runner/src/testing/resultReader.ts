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

import { open } from 'node:fs/promises';
import type { ResultEvent } from './resultHook';

/** How often the results file is read while tests run, in milliseconds. */
const POLL_INTERVAL = 500;

/**
 * Follows the results file that the result hook writes while tests run, and reports each new event.
 */
export class ResultReader {
	private offset = 0;
	private pending = Buffer.alloc(0);
	private reading: Promise<void> = Promise.resolve();
	private readonly timer: NodeJS.Timeout;

	/**
	 * Starts following a results file. The file does not have to exist yet.
	 *
	 * @param {string} file - The results file.
	 * @param {(event: ResultEvent) => void} onEvent - Called for each event, in order.
	 */
	constructor(
		private readonly file: string,
		private readonly onEvent: (event: ResultEvent) => void,
	) {
		this.timer = setInterval(() => void this.queueRead(), POLL_INTERVAL);
	}

	/**
	 * Reads the events that are left and stops following the file.
	 *
	 * @returns {Promise<void>} Resolves when all events were reported.
	 */
	async close(): Promise<void> {
		clearInterval(this.timer);
		await this.queueRead();
	}

	private queueRead(): Promise<void> {
		// A failed read, such as a file that was locked for a moment, must not stop the reads that follow.
		this.reading = this.reading.then(() => this.read()).catch(() => undefined);
		return this.reading;
	}

	private async read(): Promise<void> {
		let handle;
		try {
			handle = await open(this.file, 'r');
		} catch {
			return; // not written yet
		}
		try {
			const { size } = await handle.stat();
			if (size <= this.offset) {
				return;
			}
			const chunk = Buffer.alloc(size - this.offset);
			await handle.read(chunk, 0, chunk.length, this.offset);
			this.offset = size;
			this.pending = Buffer.concat([this.pending, chunk]);
		} finally {
			await handle.close();
		}
		// Only complete lines are parsed; the rest waits for the next read.
		let end = this.pending.indexOf('\n');
		while (end >= 0) {
			const line = this.pending.subarray(0, end).toString('utf8');
			this.pending = this.pending.subarray(end + 1);
			this.report(line);
			end = this.pending.indexOf('\n');
		}
	}

	private report(line: string): void {
		if (!line.trim()) {
			return;
		}
		try {
			this.onEvent(JSON.parse(line) as ResultEvent);
		} catch {
			// A broken line must not stop the other results.
		}
	}
}
