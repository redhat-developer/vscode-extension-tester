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
import { promisify } from 'util';
import stream from 'stream';
import { HttpProxyAgent, HttpsProxyAgent } from 'hpagent';

const retryCount = 3;
const httpProxyAgent = !process.env.HTTP_PROXY
	? undefined
	: new HttpProxyAgent({
			proxy: process.env.HTTP_PROXY,
		});

const httpsProxyAgent = !process.env.HTTPS_PROXY
	? undefined
	: new HttpsProxyAgent({
			proxy: process.env.HTTPS_PROXY,
		});

const options = {
	headers: {
		'user-agent': 'nodejs',
	},
	agent: {
		http: httpProxyAgent,
		https: httpsProxyAgent,
	},
	retry: {
		limit: retryCount,
	},
};

export class Download {
	static async getText(uri: string): Promise<string> {
		const got = (await import('got')).default;
		const body = await got(uri, options).text();
		return JSON.parse(body as string);
	}

	static async getFile(uri: string, destination: string, progress = false): Promise<void> {
		let lastTick = 0;
		const got = (await import('got')).default;
		const dlStream = got.stream(uri, options);
		// needed in order to enable retry feature:
		dlStream.once('retry', (newRetryCount: number, error) => {
			console.warn(`retry(${newRetryCount}): Failed getting ${uri} due to ${error}`);
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
		const writeStream = fs.createWriteStream(destination);

		return await promisify(stream.pipeline)(dlStream, writeStream);
	}
}
