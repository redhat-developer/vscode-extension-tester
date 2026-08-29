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

import * as path from 'path';
import * as fs from 'fs-extra';
import { PathLike } from 'fs-extra';
import * as tar from 'tar';
import extractZip from 'extract-zip';
import { exec } from 'child_process';

export class Unpack {
	static async unpack(input: PathLike, target: PathLike): Promise<void> {
		const source = input.toString();
		const destination = target.toString();
		await fs.mkdirp(destination);

		if (source.endsWith('.tar.gz')) {
			// node-tar >= 7 ignores the archive's file modes unless chmod is set —
			// the extracted `code` binary must keep its executable bit
			await tar.x({ file: source, cwd: destination, chmod: true });
		} else if (source.endsWith('.zip')) {
			if (process.platform === 'darwin' || process.platform === 'linux') {
				// system unzip preserves the .app bundle's symlinks and exec bits
				// with zero JS-side work; microsoft/vscode-test does the same
				await new Promise<void>((resolve, reject) => {
					exec(`unzip -qo "${source}"`, { cwd: destination, timeout: 120_000 }, (err) => {
						if (err) {
							reject(new Error(err.message));
						} else {
							resolve();
						}
					});
				});
			} else {
				await Unpack.unpackZipWithLibrary(source, destination);
			}
		} else {
			throw new Error(`Unsupported extension for '${source}'`);
		}
	}

	/**
	 * Zip extraction used where no system unzip is available (Windows).
	 * Kept separate so this code path stays unit-testable on every platform.
	 */
	static async unpackZipWithLibrary(source: string, destination: string): Promise<void> {
		// extract-zip requires an absolute target directory
		await extractZip(source, { dir: path.resolve(destination) });
	}
}
