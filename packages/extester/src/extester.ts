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
import type { IPackageOptions } from '@vscode/vsce';
import { DriverUtil } from './util/driverUtil';
import * as fs from 'fs-extra';
import * as path from 'node:path';
import * as os from 'node:os';
import { URL } from 'node:url';
import pjson from '../package.json';
import { globSync } from 'glob';

/** Returns true when the string contains at least one glob special character. */
function isGlobPattern(p: string): boolean {
	return /[*?{[]/.test(p);
}

/**
 * Compute the path where vsce.createVSIX() will write the .vsix file,
 * mirroring the logic of vsce's internal `getPackagePath` function.
 *
 * - If `packageOptions.packagePath` contains glob characters (`*`, `?`, `{`, `[`) it is
 *   returned as an absolute glob pattern (resolved against `cwd`) for the caller to expand.
 * - If `packageOptions.packagePath` ends with `.vsix`, it is the direct output path.
 * - If `packageOptions.packagePath` is a directory (no `.vsix` extension), the default
 *   filename is appended.
 * - If `packageOptions.packagePath` is not set, the default filename is used under `cwd`.
 * - Relative paths are resolved against `packageOptions.cwd` when provided, otherwise
 *   against `process.cwd()`.
 *
 * The default filename mirrors vsce: `<name>-<version>.vsix` (or
 * `<name>-<target>-<version>.vsix` when `target` is set).
 *
 * @param packageOptions the same IPackageOptions passed to vsce.createVSIX()
 * @returns absolute path (or absolute glob pattern) to the produced .vsix file
 */
export function resolveVsixPath(packageOptions: IPackageOptions): string {
	const cwd = packageOptions.cwd ?? process.cwd();

	const { packagePath } = packageOptions;
	if (packagePath && isGlobPattern(packagePath)) {
		// Return the pattern resolved against cwd so the caller can glob it.
		// path.resolve collapses the base + pattern correctly for absolute globs too.
		return path.resolve(cwd, packagePath);
	}

	const manifest = require(path.resolve(cwd, 'package.json')) as { name: string; version: string };
	const defaultName = packageOptions.target
		? `${manifest.name}-${packageOptions.target}-${manifest.version}.vsix`
		: `${manifest.name}-${manifest.version}.vsix`;

	if (!packagePath) {
		return path.resolve(cwd, defaultName);
	}
	// Treat as a file path when it ends with .vsix, otherwise treat as a directory
	if (packagePath.endsWith('.vsix')) {
		return path.resolve(cwd, packagePath);
	}
	return path.resolve(cwd, packagePath, defaultName);
}

export { ReleaseQuality };
export type { RunOptions };
export { MochaOptions } from 'mocha';
export * from './browser';
export * from './suite/mochaHooks';
export * from '@redhat-developer/page-objects';
export type { ExTesterConfig, ExTesterSetupConfig, ExTesterRunConfig } from './config';

export interface SetupOptions {
	/** version of VS Code to test against, defaults to latest */
	vscodeVersion?: string;
	/** vsce packaging options passed directly to vsce.createVSIX() — use e.g. `{ useYarn: true, followSymlinks: true }` */
	packageOptions?: IPackageOptions;
	/** path to a custom settings json file to apply before setup-phase CLI steps (e.g. proxy settings for marketplace installs) */
	settings?: string;
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
 * ExTester
 */
export class ExTester {
	private readonly code: CodeUtil;
	private readonly chrome: DriverUtil;

	constructor(
		storageFolder: string = DEFAULT_STORAGE_FOLDER,
		releaseType: ReleaseQuality = ReleaseQuality.Stable,
		extensionsDir?: string,
		coverage?: boolean,
	) {
		this.code = new CodeUtil(storageFolder, releaseType, extensionsDir, coverage);
		this.chrome = new DriverUtil(storageFolder);
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
	 * @param packageOptions vsce IPackageOptions passed directly to vsce.createVSIX() when packaging
	 */
	async installVsix({
		vsixFile,
		packageOptions,
		installDependencies,
	}: {
		vsixFile?: string;
		packageOptions?: IPackageOptions;
		installDependencies?: boolean;
	} = {}): Promise<void> {
		let target = vsixFile;
		if (vsixFile) {
			if (ExTester.isURL(vsixFile)) {
				target = await this.code.downloadExtension(vsixFile);
				this.code.installExtension(target);
			} else {
				const normalizedPattern = vsixFile.replace(/\\/g, '/'); // NOSONAR
				const vsixFiles = globSync(normalizedPattern);

				if (vsixFiles.length === 0) {
					throw new Error(`No VSIX files found matching pattern: ${vsixFile}`);
				}

				for (const file of vsixFiles) {
					const normalizedPath = path.normalize(file);
					const processedTarget = await this.processVsixFile(normalizedPath);
					this.code.installExtension(processedTarget);
				}
			}
		} else {
			await this.code.packageExtension(packageOptions);
			const resolvedVsix = resolveVsixPath(packageOptions ?? {});
			if (isGlobPattern(resolvedVsix)) {
				const matches = globSync(resolvedVsix.replace(/\\/g, '/')); // NOSONAR
				if (matches.length === 0) {
					throw new Error(`No VSIX files found matching pattern: ${resolvedVsix}`);
				}
				this.code.installExtension(path.normalize(matches[0]));
			} else {
				this.code.installExtension(resolvedVsix);
			}
		}

		if (installDependencies) {
			this.code.installDependencies();
		}
	}

	private static isURL(value: string): boolean {
		try {
			const url = new URL(value);
			return url.protocol === 'http:' || url.protocol === 'https:';
		} catch {
			return false;
		}
	}

	/**
	 * Processes a given VSIX file path or URL to validate and return the appropriate value.
	 *
	 * @param filePath The file path or URL of the VSIX file to process.
	 * @returns Resolves to the processed file path or base name if the input is a valid URL.
	 */
	private async processVsixFile(filePath: string): Promise<string> {
		try {
			const uri = new URL(filePath);
			if (!(process.platform === 'win32' && /^[a-zA-Z]:/.test(uri.protocol))) {
				return path.basename(filePath);
			}
		} catch {
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
		const { packageOptions, vscodeVersion, installDependencies, noCache, settings } = options;

		// Custom settings are written before any CLI-driven step so that e.g.
		// marketplace installs honor proxy settings from the settings file.
		// VSBrowser.start() rewrites the file merged with framework defaults.
		this.code.writeUserSettings(settings ?? '');

		const vscodeParsedVersion = loadCodeVersion(vscodeVersion);
		if (!offline) {
			await this.downloadCode(vscodeParsedVersion, noCache);
			await this.downloadChromeDriver(vscodeParsedVersion, noCache);
		} else {
			console.log('Attempting Setup in offline mode');
			const chromiumVersion = this.code.checkOfflineRequirements();
			const expectedChromeVersion = chromiumVersion.split('.')[0];
			const actualChromeVersion = (await this.chrome.checkDriverVersionOffline()).split('.')[0];
			if (expectedChromeVersion !== actualChromeVersion) {
				console.log(
					'\x1b[33m%s\x1b[0m',
					`WARNING: Local copy of VS Code runs Chromium version ${expectedChromeVersion}, the installed ChromeDriver is version ${actualChromeVersion}.`,
				);
				console.log(`Attempting with ChromeDriver ${actualChromeVersion} anyway. Tests may experience issues due to version mismatch.`);
			}
		}
		if (!this.code.coverageEnabled || cleanup) {
			await this.installVsix({ packageOptions });
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
		await this.setupRequirements(
			{ ...setupOptions, vscodeVersion, settings: setupOptions.settings ?? runOptions.settings },
			runOptions.offline,
			runOptions.cleanup,
		);
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

export { type CustomPageObjectsOptions } from './util/codeUtil';
