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

import * as fs from 'fs-extra';
import stream from 'node:stream';
import { HttpProxyAgent, HttpsProxyAgent } from 'hpagent';

const retryCount = 5;
const noProxy = process.env.NO_PROXY || process.env.no_proxy;

const httpProxyAgent = !process.env.HTTP_PROXY
	? undefined
	: new HttpProxyAgent({
			proxy: process.env.HTTP_PROXY,
			...(noProxy ? { noProxy } : {}),
		});

const rejectUnauthorized = +(process.env.HTTPS_TLS_REJECT_UNAUTHORIZED ?? 1) >= 1;
const httpsProxyAgent = !process.env.HTTPS_PROXY
	? undefined
	: new HttpsProxyAgent({
			proxy: process.env.HTTPS_PROXY,
			...(noProxy ? { noProxy } : {}),
		});

const options = {
	https: {
		rejectUnauthorized,
	},
	headers: {
		'user-agent': 'nodejs',
	},
	agent: {
		http: httpProxyAgent,
		https: httpsProxyAgent,
	},
	timeout: {
		request: 300_000, // 5 minutes
		response: 120_000, // 2 minutes
	},
	retry: {
		limit: retryCount,
		// The default errorCodes list does not include the content-length mismatch
		// error that `got` raises as ERR_HTTP_CONTENT_LENGTH_MISMATCH (a ReadError).
		// This intermittent network error is the root cause of flaky VS Code downloads
		// on CI runners, so we add it (and its generic fallback) here so that got's
		// built-in exponential-backoff retry fires automatically on these transient
		// failures instead of surfacing them as fatal errors.
		errorCodes: [
			'ETIMEDOUT',
			'ECONNRESET',
			'EADDRINUSE',
			'ECONNREFUSED',
			'EPIPE',
			'ENOTFOUND',
			'ENETUNREACH',
			'EAI_AGAIN',
			'ERR_HTTP_CONTENT_LENGTH_MISMATCH',
			'ERR_READING_RESPONSE_STREAM',
		],
	},
};

export class Download {
	/**
	 * Check whether a URL is reachable (HTTP 2xx) without downloading the body.
	 * Retries up to 3 times to handle transient CDN/DNS failures that would
	 * otherwise cause ChromeDriver version resolution to fall back silently.
	 */
	static async checkURL(uri: string): Promise<void> {
		const got = (await import('got')).default;
		await got.head(uri, { ...options, retry: { ...options.retry, limit: 3 } });
	}

	/**
	 * Fetch text content from a URL and parse it as JSON.
	 */
	static async getJSON<T = unknown>(uri: string): Promise<T> {
		const got = (await import('got')).default;
		const body = await got(uri, options).text();
		return JSON.parse(body) as T;
	}

	/**
	 * Fetch raw text content from a URL.
	 */
	static async getText(uri: string): Promise<string> {
		const got = (await import('got')).default;
		return await got(uri, options).text();
	}

	/**
	 * Download a file to disk atomically: writes to a `.tmp` file first, then
	 * renames on success. This prevents partial/truncated downloads from being
	 * treated as valid cached archives.
	 */
	static async getFile(uri: string, destination: string, progress = false): Promise<void> {
		const tmpDest = `${destination}.tmp`;
		let lastTick = 0;
		const got = (await import('got')).default;
		type GotStream = ReturnType<typeof got.stream>;

		try {
			await new Promise<void>((resolve, reject) => {
				// got never retries streams on its own: on a retriable failure it only emits
				// 'retry' and expects the consumer to continue with a fresh stream obtained
				// from createRetryStream(), so every attempt re-pipes into a truncated tmp file.
				const attempt = (dlStream: GotStream): void => {
					let retrying = false;
					dlStream.once('retry', (newRetryCount: number, error: unknown, createRetryStream: () => GotStream) => {
						retrying = true;
						console.warn(`retry(${newRetryCount}): Failed getting ${uri} due to ${error}`);
						attempt(createRetryStream());
					});
					if (progress) {
						dlStream.on('downloadProgress', ({ transferred, total, percent }) => {
							const currentTime = Date.now();
							if (total > 0 && (lastTick === 0 || transferred === total || currentTime - lastTick >= 2000)) {
								console.log(`progress: ${transferred}/${total} (${Math.floor(100 * percent)}%)`);
								lastTick = currentTime;
							}
						});
					}
					stream.pipeline(dlStream, fs.createWriteStream(tmpDest), (err) => {
						if (err) {
							// when a retry fired, the next attempt's pipeline settles the promise
							if (!retrying) {
								reject(err);
							}
						} else {
							resolve();
						}
					});
				};
				attempt(got.stream(uri, options));
			});
			await fs.rename(tmpDest, destination);
		} catch (err) {
			await fs.remove(tmpDest).catch(() => {});
			throw err;
		}
	}
}
