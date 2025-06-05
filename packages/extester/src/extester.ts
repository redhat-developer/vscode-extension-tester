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

import { CodeUtil, DEFAULT_RUN_OPTIONS, ReleaseQuality, RunOptions } from './util/codeUtil';
import { DriverUtil } from './util/driverUtil';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { URL } from 'url';
import pjson from '../package.json';
import { globSync } from 'glob';

export { ReleaseQuality };
export { MochaOptions } from 'mocha';
export * from './browser';
export * from './suite/mochaHooks';
export * from '@redhat-developer/page-objects';

export interface SetupOptions {
	/** version of VS Code to test against, defaults to latest */
	vscodeVersion?: string;
	/** when true run `vsce package` with the `--yarn` flag */
	useYarn?: boolean;
	/** install the extension's dependencies from the marketplace. Defaults to `false`. */
	installDependencies?: boolean;
	/** skip using cached version and download fresh copy */
	noCache?: boolean;
}

export const DEFAULT_SETUP_OPTIONS = {
	vscodeVersion: 'latest',
	installDependencies: false,
};

export const DEFAULT_STORAGE_FOLDER = process.env.TEST_RESOURCES ? process.env.TEST_RESOURCES : path.join(os.tmpdir(), 'test-resources');

export const VSCODE_VERSION_MIN = pjson.supportedVersions['vscode-min'];
export const VSCODE_VERSION_MAX = pjson.supportedVersions['vscode-max'];

/**
 * The latest version with automated tests
 */
export const NODEJS_VERSION_MAX = pjson.supportedVersions.nodejs;

/**
 * ExTester
 */
export class ExTester {
	private code: CodeUtil;
	private chrome: DriverUtil;

	constructor(
		storageFolder: string = DEFAULT_STORAGE_FOLDER,
		releaseType: ReleaseQuality = ReleaseQuality.Stable,
		extensionsDir?: string,
		coverage?: boolean,
	) {
		this.code = new CodeUtil(storageFolder, releaseType, extensionsDir, coverage);
		this.chrome = new DriverUtil(storageFolder);

		if (process.versions.node.slice(0, 2) > NODEJS_VERSION_MAX) {
			console.log(
				'\x1b[33m%s\x1b[0m',
				`\nWarning: You are using the untested NodeJS version '${process.versions.node}'. The latest supported version is '${NODEJS_VERSION_MAX}.x.x'.\n\t We recommend to use tested version to have ExTester working properly.\n\n`,
			);
		}
	}

	/**
	 * Download VS Code of given version and release quality stream
	 * @param version version to download, default latest
	 * @param noCache whether to skip using cached version
	 */
	async downloadCode(version: string = 'latest', noCache: boolean = false): Promise<void> {
		return await this.code.downloadVSCode(loadCodeVersion(version), noCache);
	}

	/**
	 * Install the extension into the test instance of VS Code
	 * @param vsixFile path to extension .vsix file. If not set, default vsce path will be used
	 * @param useYarn when true run `vsce package` with the `--yarn` flag
	 */
	async installVsix({
		vsixFile,
		useYarn,
		installDependencies,
	}: {
		vsixFile?: string;
		useYarn?: boolean;
		installDependencies?: boolean;
	} = {}): Promise<void> {
		let target = vsixFile;
		if (vsixFile) {
			try {
				// Attempt to handle vsixFile as a URL
				const uri = new URL(vsixFile);
				target = await this.code.downloadExtension(uri.toString());
				this.code.installExtension(target);
			} catch (urlError) {
				//Convert Windows-style paths to Unix-style for glob
				const normalizedPattern = vsixFile.replace(/\\/g, '/');
				const vsixFiles = globSync(normalizedPattern);

				if (vsixFiles.length === 0) {
					throw new Error(`No VSIX files found matching pattern: ${vsixFile}`);
				}

				for (const file of vsixFiles) {
					try {
						const normalizedPath = path.normalize(file);
						const target = await this.processVsixFile(normalizedPath);
						this.code.installExtension(target);
					} catch (error) {
						console.error(`Error installing ${file}:`, error);
					}
				}
			}
		} else {
			await this.code.packageExtension(useYarn);
			this.code.installExtension(target);
		}

		if (installDependencies) {
			this.code.installDependencies();
		}
	}

	/**
	 * Processes a given VSIX file path or URL to validate and return the appropriate value.
	 *
	 * @param filePath The file path or URL of the VSIX file to process.
	 * @returns Resolves to the processed file path or base name if the input is a valid URL.
	 */
	private async processVsixFile(filePath: string): Promise<string> {
		console.log(`Processing VSIX file: ${filePath}`);
		try {
			const uri = new URL(filePath);
			console.log(`Parsed URI: ${uri}`);
			if (!(process.platform === 'win32' && /^[a-zA-Z]:/.test(uri.protocol))) {
				return path.basename(filePath);
			}
		} catch {
			console.log(`File is not a valid URL. Checking existence: ${filePath}`);
			await fs.stat(filePath).catch(() => {
				throw new Error(`File ${filePath} does not exist.`);
			});
		}
		return filePath;
	}

	/**
	 * Install an extension from VS Code marketplace into the test instance
	 * @param id id of the extension to install
	 */
	async installFromMarketplace(id: string, preRelease?: boolean): Promise<void> {
		return this.code.installExtension(undefined, id, preRelease);
	}

	/**
	 * Download the matching chromedriver for a given VS Code version
	 * @param vscodeVersion selected version of VS Code, default latest
	 * @param noCache whether to skip using cached version
	 */
	async downloadChromeDriver(vscodeVersion: string = 'latest', noCache: boolean = false): Promise<string> {
		const chromiumVersion = await this.code.getChromiumVersion(loadCodeVersion(vscodeVersion));
		return await this.chrome.downloadChromeDriverForChromiumVersion(chromiumVersion, noCache);
	}

	/**
	 * Performs all necessary setup: getting VS Code + ChromeDriver
	 * and packaging/installing extension into the test instance
	 *
	 * @param options Additional options for setting up the tests
	 * @param offline whether to run in offline mode
	 * @param cleanup whether to clean up after tests
	 * @param noCache whether to skip using cached version
	 */
	async setupRequirements(options: SetupOptions = DEFAULT_SETUP_OPTIONS, offline = false, cleanup = false): Promise<void> {
		const { useYarn, vscodeVersion, installDependencies, noCache } = options;

		const vscodeParsedVersion = loadCodeVersion(vscodeVersion);
		if (!offline) {
			await this.downloadCode(vscodeParsedVersion, noCache);
			await this.downloadChromeDriver(vscodeParsedVersion, noCache);
		} else {
			console.log('Attempting Setup in offline mode');
			const expectedChromeVersion = this.code.checkOfflineRequirements().split('.')[0];
			const actualChromeVersion = (await this.chrome.checkDriverVersionOffline(vscodeParsedVersion)).split('.')[0];
			if (expectedChromeVersion !== actualChromeVersion) {
				console.log(
					'\x1b[33m%s\x1b[0m',
					`WARNING: Local copy of VS Code runs Chromium version ${expectedChromeVersion}, the installed ChromeDriver is version ${actualChromeVersion}.`,
				);
				console.log(`Attempting with ChromeDriver ${actualChromeVersion} anyway. Tests may experience issues due to version mismatch.`);
			}
		}
		if (!this.code.coverageEnabled || cleanup) {
			await this.installVsix({ useYarn });
		}
		if (installDependencies && !offline) {
			this.code.installDependencies();
		}
	}

	/**
	 * Performs requirements setup and runs extension tests
	 *
	 * @param testFilesPattern glob pattern(s) for test files to run
	 * @param vscodeVersion version of VS Code to test against, defaults to latest
	 * @param setupOptions Additional options for setting up the tests
	 * @param runOptions Additional options for running the tests
	 *
	 * @returns Promise resolving to the mocha process exit code - 0 for no failures, 1 otherwise
	 */
	async setupAndRunTests(
		testFilesPattern: string | string[],
		vscodeVersion: string = 'latest',
		setupOptions: Omit<SetupOptions, 'vscodeVersion'> = DEFAULT_SETUP_OPTIONS,
		runOptions: Omit<RunOptions, 'vscodeVersion'> = DEFAULT_RUN_OPTIONS,
	): Promise<number> {
		await this.setupRequirements({ ...setupOptions, vscodeVersion }, runOptions.offline, runOptions.cleanup);
		return await this.runTests(testFilesPattern, {
			...runOptions,
			vscodeVersion,
		});
	}

	/**
	 * Runs the selected test files in VS Code using mocha and webdriver
	 * @param testFilesPattern glob pattern(s) for selected test files
	 * @param runOptions Additional options for running the tests
	 *
	 * @returns Promise resolving to the mocha process exit code - 0 for no failures, 1 otherwise
	 */
	async runTests(testFilesPattern: string | string[], runOptions: RunOptions = DEFAULT_RUN_OPTIONS): Promise<number> {
		runOptions.vscodeVersion = loadCodeVersion(runOptions.vscodeVersion);
		const patterns = typeof testFilesPattern === 'string' ? [testFilesPattern] : testFilesPattern;
		return await this.code.runTests(patterns, runOptions);
	}
}

export function loadCodeVersion(version: string | undefined): string {
	const codeVersion = process.env.CODE_VERSION ? process.env.CODE_VERSION : version;

	if (codeVersion !== undefined) {
		if (codeVersion.toLowerCase() === 'max') {
			return VSCODE_VERSION_MAX;
		}
		if (codeVersion.toLowerCase() === 'min') {
			return VSCODE_VERSION_MIN;
		}
		return codeVersion;
	}
	return 'latest';
}
