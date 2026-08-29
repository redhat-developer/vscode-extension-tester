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
		const driverBinary = this.getChromeDriverBinaryPath();

		if (!noCache && fs.existsSync(driverBinary)) {
			let localVersion = '';
			try {
				localVersion = await this.getLocalDriverVersion();
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
	 * Locate the ChromeDriver binary inside a storage folder. Every supported
	 * driver (>= 115, required by the VS Code 1.90+ floor) unpacks into the
	 * nested Chrome-for-Testing layout; a flat binary can only be a stale
	 * pre-115 leftover and is deliberately ignored. Keeping the decision
	 * disk-based means the launcher and the downloader cannot disagree about
	 * where the binary lives.
	 */
	static findChromeDriverBinary(storageFolder: string = DEFAULT_STORAGE_FOLDER): string {
		const binary = process.platform === 'win32' ? 'chromedriver.exe' : 'chromedriver';
		const nested = path.join(storageFolder, `chromedriver-${DriverUtil.getChromeDriverPlatform()}`, binary);
		if (fs.existsSync(nested)) {
			return nested;
		}
		throw new Error(`No ChromeDriver binary found at '${nested}'. Run 'extest get-chromedriver' first.`);
	}

	private getChromeDriverBinaryPath(): string {
		const binary = process.platform === 'win32' ? 'chromedriver.exe' : 'chromedriver';
		return path.join(this.downloadFolder, `chromedriver-${DriverUtil.getChromeDriverPlatform()}`, binary);
	}

	/**
	 * Translate a selenium log level into ChromeDriver service arguments.
	 * ChromeDriver's --verbose (= --log-level=ALL) records the full CDP wire
	 * traffic and grows the log by hundreds of MB over a long session, so the
	 * driver only gets that level when the user asks for finer-than-DEBUG
	 * logging; the default INFO still records session lifecycle and command
	 * results.
	 */
	static chromeDriverLogLevelArgs(level: logging.Level | string): string[] {
		const resolved = DriverUtil.resolveLogLevel(level);
		return [`--log-level=${DriverUtil.chromeDriverLogLevel(resolved)}`, '--readable-timestamp'];
	}

	/**
	 * Resolve a webdriver log level that may arrive as a name string (the
	 * --log_level CLI option passes e.g. 'Info' through unchanged). Note that
	 * selenium's logging.getLevel is case-sensitive and silently returns ALL
	 * for unknown names, so normalize first and default unknown names to INFO
	 * rather than accidentally enabling full wire logging.
	 */
	static resolveLogLevel(level: logging.Level | string): logging.Level {
		if (typeof level !== 'string') {
			return level;
		}
		const name = level.trim().toUpperCase();
		const known = ['OFF', 'SEVERE', 'WARNING', 'INFO', 'DEBUG', 'FINE', 'FINER', 'FINEST', 'ALL'];
		return known.includes(name) ? logging.getLevel(name) : logging.Level.INFO;
	}

	private static chromeDriverLogLevel(level: logging.Level): string {
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
		return driverLevel;
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

	private getChromeDriverURL(version: string): string {
		const driverPlatform = DriverUtil.getChromeDriverPlatform();
		return `https://storage.googleapis.com/chrome-for-testing-public/${version}/${driverPlatform}/chromedriver-${driverPlatform}.zip`;
	}

	async checkDriverVersionOffline(): Promise<string> {
		try {
			return await this.getLocalDriverVersion();
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
			const local = await this.getLocalDriverVersion();
			return local.startsWith(version);
		} catch {
			return false;
		}
	}

	private async getLocalDriverVersion(): Promise<string> {
		// Invoke the binary directly (no shell) so the path is passed as-is and
		// cannot be interpreted as shell syntax, and require the resolved binary
		// path to stay inside the storage folder — a crafted storage value cannot
		// traverse out or smuggle shell syntax anywhere.
		const binaryPath = path.resolve(this.getChromeDriverBinaryPath());
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
	 * Tries the exact full Chromium version first (e.g. 148.0.7778.280), because
	 * VS Code ships a specific Chromium build whose ChromeDriver may not yet be
	 * promoted to the stable channel but is available at the exact URL.
	 * @param chromiumVersion Chromium version to check against
	 */
	private async getChromeDriverVersion(chromiumVersion: string): Promise<string> {
		const majorVersion = this.getMajorVersion(chromiumVersion);

		// Chrome for Testing only hosts chromedriver 115+; older Chromium comes
		// from VS Code builds below the supported floor.
		if (+majorVersion < 115) {
			throw new Error(
				`Chromium ${chromiumVersion} requires a ChromeDriver older than 115, which is no longer supported. ExTester requires VS Code 1.90 or newer.`,
			);
		}

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

	private getMajorVersion(version: string): string {
		return version.split('.')[0];
	}
}
