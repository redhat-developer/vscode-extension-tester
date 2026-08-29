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
import * as path from 'path';
import * as childProcess from 'child_process';
import { logging } from 'selenium-webdriver';
import { Unpack } from './unpack';
import { Download } from './download';
import { DEFAULT_STORAGE_FOLDER } from '../extester';

/**
 * Handles version checks and download of ChromeDriver
 */
export class DriverUtil {
	private downloadFolder: string;

	/**
	 * Create an instance of chrome driver handler
	 * @param folder path to a folder to store all artifacts
	 */
	constructor(folder: string = DEFAULT_STORAGE_FOLDER) {
		this.downloadFolder = path.resolve(folder);
	}

	/**
	 * Find a matching ChromeDriver version for a given Chromium version and download it.
	 * @param chromiumVersion version of Chromium to match the ChromeDriver against
	 */
	async downloadChromeDriverForChromiumVersion(chromiumVersion: string, noCache: boolean = false): Promise<string> {
		const version = await this.getChromeDriverVersion(chromiumVersion);
		return await this.downloadChromeDriver(version, noCache);
	}

	/**
	 * Download a given version ChromeDriver
	 * @param version version to download
	 */
	async downloadChromeDriver(version: string, noCache: boolean = false): Promise<string> {
		// The version string originates from external sources (CLI input, remote
		// release metadata, the browser's build info). Replace it with a value
		// rebuilt from its parsed numeric components before it flows into URLs,
		// filesystem paths, process arguments or log output.
		version = DriverUtil.sanitizeVersion(version);
		const url = this.getChromeDriverURL(version);
		const driverBinary = this.getChromeDriverBinaryPath(version);

		if (!noCache && fs.existsSync(driverBinary)) {
			let localVersion = '';
			try {
				localVersion = await this.getLocalDriverVersion(version);
			} catch (err) {
				// ignore and download
			}
			if (localVersion.startsWith(version)) {
				console.log(`ChromeDriver ${version} exists in local cache, skipping download`);
				return driverBinary;
			}
		}

		fs.mkdirpSync(this.downloadFolder);
		const fileName = path.join(this.downloadFolder, noCache ? `${path.basename(url)}` : `${version}-${path.basename(url)}`);
		if (!noCache && fs.existsSync(fileName)) {
			console.log(`ChromeDriver ${version} exists in storage folder, skipping download`);
		} else {
			console.log(`Downloading ChromeDriver ${version}`);
			await Download.getFile(url, fileName, true);
		}

		// Only unpack if the binary doesn't exist yet or its version doesn't match
		if (!fs.existsSync(driverBinary) || !(await this.isLocalVersionMatch(version))) {
			console.log(`Unpacking ChromeDriver ${version} into ${this.downloadFolder}`);
			await Unpack.unpack(fileName, this.downloadFolder);
		} else {
			console.log(`ChromeDriver ${version} binary already present, skipping unpack`);
		}

		if (process.platform !== 'win32') {
			fs.chmodSync(driverBinary, 0o755);
		}

		if (noCache) {
			await fs.remove(fileName);
			console.log('Removed downloaded archive as --no_cache is active');
		}

		console.log('Success!');
		return driverBinary;
	}

	/**
	 * Locate the ChromeDriver binary inside a storage folder by what is actually
	 * on disk: the nested Chrome-for-Testing layout (chromedriver >= 115) is
	 * preferred over the flat legacy layout. Keeping the decision disk-based
	 * means the launcher and the downloader cannot disagree about where the
	 * binary lives.
	 */
	static findChromeDriverBinary(storageFolder: string = DEFAULT_STORAGE_FOLDER): string {
		const binary = process.platform === 'win32' ? 'chromedriver.exe' : 'chromedriver';
		const nested = path.join(storageFolder, `chromedriver-${DriverUtil.getChromeDriverPlatform()}`, binary);
		const flat = path.join(storageFolder, binary);
		if (fs.existsSync(nested)) {
			return nested;
		}
		if (fs.existsSync(flat)) {
			return flat;
		}
		throw new Error(`No ChromeDriver binary found in the storage folder, looked for '${nested}' and '${flat}'. Run 'extest get-chromedriver' first.`);
	}

	private getChromeDriverBinaryPath(version: string): string {
		const majorVersion = this.getMajorVersion(version);
		const binary = process.platform === 'win32' ? 'chromedriver.exe' : 'chromedriver';
		let driverBinaryPath = path.join(this.downloadFolder, binary);
		if (+majorVersion > 114) {
			driverBinaryPath = path.join(this.downloadFolder, `chromedriver-${DriverUtil.getChromeDriverPlatform()}`, binary);
		}
		return driverBinaryPath;
	}

	/**
	 * Translate a selenium log level into ChromeDriver service arguments.
	 * ChromeDriver's --verbose (= --log-level=ALL) records the full CDP wire
	 * traffic and grows the log by hundreds of MB over a long session, so the
	 * driver only gets that level when the user asks for finer-than-DEBUG
	 * logging; the default INFO still records session lifecycle and command
	 * results.
	 */
	static chromeDriverLogLevelArgs(level: logging.Level): string[] {
		let driverLevel: string;
		if (level === logging.Level.OFF) {
			driverLevel = 'OFF';
		} else if (level.value >= logging.Level.SEVERE.value) {
			driverLevel = 'SEVERE';
		} else if (level.value >= logging.Level.WARNING.value) {
			driverLevel = 'WARNING';
		} else if (level.value >= logging.Level.INFO.value) {
			driverLevel = 'INFO';
		} else if (level.value >= logging.Level.DEBUG.value) {
			driverLevel = 'DEBUG';
		} else {
			driverLevel = 'ALL';
		}
		return [`--log-level=${driverLevel}`, '--readable-timestamp'];
	}

	static getChromeDriverPlatform(): string | undefined {
		switch (process.platform) {
			case 'darwin':
				return `mac-${process.arch}`;
			case 'win32':
				return process.arch === 'x64' ? 'win64' : 'win32';
			case 'linux':
				return 'linux64';
			default:
				break;
		}
		return undefined;
	}

	private static getChromeDriverPlatformOLD(): string | undefined {
		switch (process.platform) {
			case 'darwin':
				return process.arch === 'arm64' ? 'mac_arm64' : 'mac64';
			case 'win32':
				return 'win32';
			case 'linux':
				return 'linux64';
			default:
				break;
		}
		return undefined;
	}

	private getChromeDriverURL(version: string): string {
		const majorVersion = this.getMajorVersion(version);
		let driverPlatform = DriverUtil.getChromeDriverPlatformOLD();
		let url = `https://chromedriver.storage.googleapis.com/${version}/chromedriver_${driverPlatform}.zip`;
		if (+majorVersion > 114) {
			driverPlatform = DriverUtil.getChromeDriverPlatform();
			url = `https://storage.googleapis.com/chrome-for-testing-public/${version}/${driverPlatform}/chromedriver-${driverPlatform}.zip`;
		}
		return url;
	}

	async checkDriverVersionOffline(version: string): Promise<string> {
		try {
			return await this.getLocalDriverVersion(version);
		} catch (err) {
			console.log('ERROR: Cannot find a copy of ChromeDriver in local cache in offline mode, exiting.');
			throw err;
		}
	}

	/**
	 * Check local chrome driver version
	 */
	private async isLocalVersionMatch(version: string): Promise<boolean> {
		try {
			const local = await this.getLocalDriverVersion(version);
			return local.startsWith(version);
		} catch {
			return false;
		}
	}

	private async getLocalDriverVersion(version: string): Promise<string> {
		// Invoke the binary directly (no shell) so the path is passed as-is and
		// cannot be interpreted as shell syntax. The version component is rebuilt
		// from parsed integers, and the resolved binary path must stay inside the
		// storage folder — a crafted version or storage value cannot traverse out
		// or smuggle shell syntax anywhere.
		version = DriverUtil.sanitizeVersion(version);
		const binaryPath = path.resolve(this.getChromeDriverBinaryPath(version));
		const storageRoot = path.resolve(this.downloadFolder) + path.sep;
		if (!binaryPath.startsWith(storageRoot)) {
			throw new Error('Resolved ChromeDriver binary path escapes the storage folder');
		}
		return new Promise<string>((resolve, reject) => {
			childProcess.execFile(binaryPath, ['-v'], { timeout: 15_000 }, (err, stdout) => {
				if (err) {
					return reject(new Error(err.message));
				}
				resolve(stdout.split(' ')[1]);
			});
		});
	}

	/**
	 * Parse a ChromeDriver version string (a plain dotted number sequence such
	 * as 114 or 114.0.5735.90) and rebuild it from its numeric components.
	 * Throws for any other shape. Returning a string reconstructed from parsed
	 * integers — never the original input — guarantees that whatever reaches
	 * URLs, filesystem paths, process arguments or log messages contains only
	 * digits and dots, regardless of where the input came from.
	 */
	private static sanitizeVersion(version: string): string {
		const parts = version.trim().split('.');
		if (parts.length === 0 || parts.length > 4 || parts.some((part) => !/^\d{1,10}$/.test(part))) {
			throw new Error('Invalid ChromeDriver version format');
		}
		return parts.map((part) => Number.parseInt(part, 10)).join('.');
	}

	/**
	 * Find a matching version of ChromeDriver for a given Chromium version.
	 * For Chrome for Testing (major > 114), tries the exact full Chromium version first
	 * (e.g. 148.0.7778.280) before falling back to LATEST_RELEASE_{major}. This is
	 * necessary because VS Code ships a specific Chromium build whose ChromeDriver
	 * may not yet be promoted to the stable channel but is available at the exact URL.
	 * @param chromiumVersion Chromium version to check against
	 */
	private async getChromeDriverVersion(chromiumVersion: string): Promise<string> {
		const majorVersion = this.getMajorVersion(chromiumVersion);

		// chrome driver versioning has changed for chrome 70+
		if (+majorVersion < 70) {
			if (this.chromiumVersionMap[+majorVersion]) {
				return this.chromiumVersionMap[+majorVersion];
			} else {
				throw new Error(`Chromium version ${chromiumVersion} not supported`);
			}
		}

		if (+majorVersion > 114) {
			// Try the exact Chromium version first — VS Code ships a specific build
			// that may have a matching ChromeDriver not yet in the stable release channel.
			const platform = DriverUtil.getChromeDriverPlatform();
			const exactUrl = `https://storage.googleapis.com/chrome-for-testing-public/${chromiumVersion}/${platform}/chromedriver-${platform}.zip`;
			try {
				await Download.checkURL(exactUrl);
				return chromiumVersion;
			} catch {
				// exact version not available — fall through to LATEST_RELEASE lookup
			}

			// Chrome for Testing hosts Electron's exact Chromium patches for some
			// platforms only, so after an exact miss ask for the latest release of
			// the same MAJOR.MINOR.BUILD — that keeps every platform on one
			// consistent build — before settling for the milestone-level latest,
			// which may be a newer build than the Chromium VS Code actually ships.
			const cftBase = 'https://googlechromelabs.github.io/chrome-for-testing';
			const buildVersion = chromiumVersion.split('.').slice(0, 3).join('.');
			try {
				return (await Download.getText(`${cftBase}/LATEST_RELEASE_${buildVersion}`)).trim();
			} catch {
				return (await Download.getText(`${cftBase}/LATEST_RELEASE_${majorVersion}`)).trim();
			}
		}

		const url = `https://chromedriver.storage.googleapis.com/LATEST_RELEASE_${majorVersion}`;
		const fileName = 'driverVersion';
		await Download.getFile(url, path.join(this.downloadFolder, fileName));
		return fs.readFileSync(path.join(this.downloadFolder, fileName)).toString();
	}

	private getMajorVersion(version: string): string {
		return version.split('.')[0];
	}

	// older chromedriver versions do not match chrome versions
	private readonly chromiumVersionMap: VersionMap = {
		69: '2.38',
		68: '2.38',
		67: '2.38',
		66: '2.38',
		65: '2.37',
		64: '2.36',
		63: '2.35',
		62: '2.34',
		61: '2.33',
		60: '2.32',
	};
}

interface VersionMap {
	[key: number]: string;
}
