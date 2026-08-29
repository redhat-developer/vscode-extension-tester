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

import * as childProcess from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as vsce from '@vscode/vsce';
import type { IPackageOptions } from '@vscode/vsce';
import { VSRunner } from '../suite/runner';
import { Unpack } from './unpack';
import { logging } from 'selenium-webdriver';
import { Download } from './download';
import { DEFAULT_STORAGE_FOLDER } from '../extester';

export enum ReleaseQuality {
	Stable = 'stable',
	Insider = 'insider',
}

export interface CustomPageObjectsOptions {
	/**
	 * Path to a compiled JS module that exports a `locators` object
	 * matching the LocatorDiff shape. These locators are deep-merged
	 * into the built-in locators after version resolution, before tests run.
	 */
	locatorsPath: string;
}

export interface RunOptions {
	/** version of VS Code to test against, defaults to latest */
	vscodeVersion?: string;
	/** path to custom settings json file */
	settings?: string;
	/** remove the extension's directory as well (if present) */
	cleanup?: boolean;
	/** path to a custom mocha configuration file */
	config?: string;
	/** logging level of the Webdriver */
	logLevel?: logging.Level;
	/** try to perform all setup without internet connection, needs all requirements pre-downloaded manually */
	offline?: boolean;
	/** list of resources to be opened by VS Code */
	resources: string[];
	/** custom page objects locator contribution to load at startup */
	customPageObjects?: CustomPageObjectsOptions;
	/** Display language locale for VS Code (e.g. 'ru', 'zh-cn', 'fr'). Requires the matching language pack extension to be installed. */
	locale?: string;
}

/** defaults for the [[RunOptions]] */
export const DEFAULT_RUN_OPTIONS = {
	vscodeVersion: 'latest',
	settings: '',
	logLevel: logging.Level.INFO,
	offline: false,
	resources: [],
	noCache: false,
};

/**
 * Handles the VS Code instance used for testing.
 * Includes downloading, unpacking, launching, and version checks.
 */
export class CodeUtil {
	private readonly codeFolder: string;
	private readonly downloadPlatform: string;
	private readonly downloadFolder: string;
	private readonly releaseType: ReleaseQuality;
	private executablePath!: string;
	private macExecutableResolved = false;
	private cliPath!: string;
	private cliPathResolved = false;
	private cliEnv!: string;
	private availableVersions: string[];
	private readonly extensionsFolder: string | undefined;
	private readonly coverage: boolean | undefined;
	private readonly env: NodeJS.ProcessEnv = { ...process.env };
	private cachedCodeVersion: string | undefined;

	/**
	 * Create an instance of code handler
	 * @param folder Path to folder where all the artifacts will be stored.
	 * @param extensionsFolder Path to use as extensions directory by VS Code
	 */
	constructor(folder: string = DEFAULT_STORAGE_FOLDER, type: ReleaseQuality = ReleaseQuality.Stable, extensionsFolder?: string, coverage?: boolean) {
		this.availableVersions = [];
		this.downloadPlatform = this.getPlatform();
		this.downloadFolder = path.resolve(folder);
		this.extensionsFolder = extensionsFolder ? path.resolve(extensionsFolder) : undefined;
		this.coverage = coverage;
		this.releaseType = type;

		if (type === ReleaseQuality.Stable) {
			this.codeFolder = path.join(this.downloadFolder, process.platform === 'darwin' ? 'Visual Studio Code.app' : `VSCode-${this.downloadPlatform}`);
		} else {
			this.codeFolder = path.join(
				this.downloadFolder,
				process.platform === 'darwin' ? 'Visual Studio Code - Insiders.app' : `VSCode-${this.downloadPlatform}-insider`,
			);
		}
		this.findExecutables();
		// remove unsafe env variables from current process to avoid spam messages like:
		// Node.js environment variables are disabled because this process is invoked by other apps.
		// See https://github.com/microsoft/vscode/issues/204005
		for (const key in this.env) {
			if (key.startsWith('NODE_')) {
				delete this.env[key];
			}
		}
	}

	/**
	 * Get all versions for the given release stream
	 */
	async getVSCodeVersions(): Promise<string[]> {
		const apiUrl = `https://update.code.visualstudio.com/api/releases/${this.releaseType}`;
		return await Download.getJSON<string[]>(apiUrl);
	}

	/**
	 * Download and unpack VS Code for testing purposes
	 *
	 * @param version VS Code version to get, default latest
	 * @param noCache whether to skip using cached version
	 */
	async downloadVSCode(version: string = 'latest', noCache: boolean = false): Promise<void> {
		await this.checkCodeVersion(version);
		const literalVersion = version === 'latest' ? this.availableVersions[0] : version;
		if (this.releaseType === ReleaseQuality.Stable && literalVersion !== this.availableVersions[0]) {
			console.log(
				'\x1b[33m%s\x1b[0m',
				`\n\nWARNING: You are using the outdated VS Code version '${literalVersion}'. The latest stable version is '${this.availableVersions[0]}'.\n\n`,
			);
		}

		console.log(`Downloading VS Code: ${literalVersion} / ${this.releaseType}`);
		if (!fs.existsSync(this.getExecutablePath()) || this.getExistingCodeVersion() !== literalVersion || noCache) {
			this.cachedCodeVersion = undefined;
			fs.mkdirpSync(this.downloadFolder);

			const url = ['https://update.code.visualstudio.com', version, this.downloadPlatform, this.releaseType].join('/');
			const isTarGz = this.downloadPlatform.includes('linux');
			const fileExtension = isTarGz ? 'tar.gz' : 'zip';
			let versionPart = '';
			if (this.releaseType === ReleaseQuality.Stable) {
				versionPart = `-${this.releaseType}`;
			}

			let fileName;
			if (noCache) {
				fileName = this.releaseType + '.' + fileExtension;
			} else {
				fileName = literalVersion + versionPart + '.' + fileExtension;
			}
			const zipPath = path.join(this.downloadFolder, fileName);

			if (!noCache && fs.existsSync(zipPath)) {
				console.log(`VS Code archive ${fileName} already exists in storage folder, skipping download`);
			} else {
				console.log(`Downloading VS Code from: ${url}`);
				await Download.getFile(url, zipPath, true);
				console.log(`Downloaded VS Code into ${zipPath}`);
			}

			// A corrupted archive (truncated download, stale cache entry) produces a broken
			// VS Code install that fails much later in confusing ways ("installation appears
			// to be corrupt", extension host not starting). Verify the archive up front and
			// re-download once before unpacking.
			if (!this.verifyArchiveIntegrity(zipPath)) {
				console.warn(`VS Code archive ${fileName} is corrupted, re-downloading...`);
				await fs.remove(zipPath);
				await Download.getFile(url, zipPath, true);
				if (!this.verifyArchiveIntegrity(zipPath)) {
					throw new Error(`Downloaded VS Code archive is corrupted: ${zipPath}`);
				}
			}

			const tempPrefix = path.join(this.downloadFolder, 'vscode-temp-');
			console.log(`Unpacking VS Code into ${this.downloadFolder}`);
			const target = await fs.mkdtemp(tempPrefix);

			try {
				await Unpack.unpack(zipPath, target);
				let rootDir = target;
				const files = await fs.readdir(target);
				if (files.length === 1) {
					rootDir = path.join(target, files[0]);
				}
				await fs.move(rootDir, this.codeFolder, { overwrite: true });
				if (process.platform === 'darwin') {
					// Remove macOS quarantine attribute that may be inherited from the downloaded
					// zip on newer macOS versions (Sequoia / Tahoe), which would prevent
					// the hardened-runtime app bundle from launching via ChromeDriver.
					try {
						childProcess.execSync(`xattr -r -d com.apple.quarantine "${this.codeFolder}"`, { stdio: 'ignore', timeout: 30_000 });
					} catch {
						// xattr -d exits non-zero when the attribute is absent. Verify that
						// quarantine is actually gone; only fail if it persists.
						try {
							const attrs = childProcess.execSync(`xattr "${this.codeFolder}"`, { timeout: 10_000 }).toString();
							if (attrs.includes('com.apple.quarantine')) {
								throw new Error(`Failed to remove quarantine attribute from ${this.codeFolder}`);
							}
						} catch (verifyErr) {
							if (verifyErr instanceof Error && verifyErr.message.includes('Failed to remove quarantine')) {
								throw verifyErr;
							}
							// xattr listing itself failed — attribute is likely absent
						}
					}
				}
				console.log('Success!');
				if (noCache) {
					await fs.remove(zipPath);
					console.log('Removed downloaded archive as --no_cache is active');
				}
			} finally {
				await fs.remove(target);
			}
		} else {
			console.log('VS Code exists in local cache, skipping download');
		}
	}

	/**
	 * Check that a downloaded VS Code archive is a readable, complete archive.
	 * Returns true when the archive passes the check or when no suitable
	 * verification tool is available on the current platform.
	 */
	private verifyArchiveIntegrity(archive: string): boolean {
		if (process.platform === 'win32') {
			// No archive test tool is guaranteed to exist on Windows — skip verification
			return true;
		}
		try {
			if (archive.endsWith('.tar.gz')) {
				childProcess.execSync(`tar -tzf "${archive}"`, { stdio: 'ignore', timeout: 120_000 });
			} else {
				childProcess.execSync(`unzip -t -qq "${archive}"`, { stdio: 'ignore', timeout: 120_000 });
			}
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Install your extension into the test instance of VS Code
	 */
	installExtension(vsix?: string, id?: string, preRelease?: boolean): void {
		const pjson = require(path.resolve('package.json'));
		if (id) {
			return this.installExt(id, preRelease);
		}
		const vsixPath = path.resolve(vsix || `${pjson.name}-${pjson.version}.vsix`);
		this.installExt(vsixPath);
	}

	/**
	 * Install extension dependencies from marketplace
	 */
	installDependencies(): void {
		const pjson = require(path.resolve('package.json'));
		const deps = pjson.extensionDependencies;
		if (!deps) {
			return;
		}
		for (const id of deps as string[]) {
			this.installExt(id);
		}
	}

	private getCliPath(): string {
		if (process.platform === 'win32' && !this.cliPathResolved) {
			this.cliPathResolved = true;
			this.cliPath = this.findWindowsCliPath();
		}
		return this.cliPath;
	}

	private getCliInitCommand(): string {
		return `${this.cliEnv} "${this.getExecutablePath()}" "${this.getCliPath()}"`;
	}

	private installExt(pathOrID: string, preRelease?: boolean): void {
		let command = `${this.getCliInitCommand()} --force --install-extension "${pathOrID}"`;
		if (preRelease) {
			command += ' --pre-release';
		}
		if (this.extensionsFolder) {
			command += ` --extensions-dir="${this.extensionsFolder}"`;
		}
		command += ` --user-data-dir="${path.join(this.downloadFolder, 'settings')}"`;
		childProcess.execSync(command, { stdio: 'inherit', timeout: 120_000 });
	}

	/**
	 * Open files/folders in running vscode
	 * @param paths vararg paths to files or folders to open
	 */
	open(...paths: string[]): void {
		const segments = paths.map((f) => `"${f}"`).join(' ');
		const command = `${this.getCliInitCommand()} -r ${segments} --user-data-dir="${path.join(this.downloadFolder, 'settings')}"`;
		childProcess.execSync(command, { timeout: 30000 });
	}

	/**
	 * Download a vsix file
	 * @param vsixURL URL of the vsix file
	 */
	async downloadExtension(vsixURL: string): Promise<string> {
		fs.mkdirpSync(this.downloadFolder);
		const fileName = path.basename(vsixURL);
		const target = path.join(this.downloadFolder, fileName);
		if (!fileName.endsWith('.vsix')) {
			throw new Error('The URL does not point to a vsix file');
		}

		console.log(`Downloading ${fileName}`);
		await Download.getFile(vsixURL, target);
		console.log('Success!');
		return target;
	}

	/**
	 * Package extension into a vsix file
	 * @param packageOptions vsce IPackageOptions to pass directly to vsce.createVSIX()
	 */
	async packageExtension(packageOptions?: IPackageOptions): Promise<void> {
		await vsce.createVSIX(packageOptions ?? {});
	}

	/**
	 * Uninstall the tested extension from the test instance of VS Code
	 *
	 * @param cleanup remove the extension's directory as well.
	 */
	uninstallExtension(cleanup?: boolean): void {
		const pjson = require(path.resolve('package.json'));
		const extension = `${pjson.publisher}.${pjson.name}`;

		if (cleanup) {
			let command = `${this.getCliInitCommand()} --uninstall-extension "${extension}"`;
			if (this.extensionsFolder) {
				command += ` --extensions-dir="${this.extensionsFolder}"`;
			}
			childProcess.execSync(command, { stdio: 'inherit', timeout: 60_000 });
		}
	}

	/**
	 * Run tests in your test environment using mocha
	 *
	 * @param testFilesPattern glob pattern of test files to run
	 * @param runOptions additional options for customizing the test run
	 *
	 * @return The exit code of the mocha process
	 */
	async runTests(testFilesPattern: string[], runOptions: RunOptions = DEFAULT_RUN_OPTIONS): Promise<number> {
		if (!runOptions.offline) {
			await this.checkCodeVersion(runOptions.vscodeVersion ?? DEFAULT_RUN_OPTIONS.vscodeVersion);
		} else {
			this.availableVersions = [this.getExistingCodeVersion()];
		}
		const literalVersion =
			runOptions.vscodeVersion === undefined || runOptions.vscodeVersion === 'latest' ? this.availableVersions[0] : runOptions.vscodeVersion;

		// Save the original environment so we can restore it after the test run
		const savedEnv = { ...process.env };

		const key = 'PATH';
		process.env[key] = [this.downloadFolder, process.env[key]].join(path.delimiter);
		process.env.TEST_RESOURCES = this.downloadFolder;
		if (this.extensionsFolder) {
			process.env.EXTENSIONS_FOLDER = this.extensionsFolder;
		} else {
			delete process.env.EXTENSIONS_FOLDER;
		}
		if (this.coverage) {
			process.env.EXTENSION_DEV_PATH = process.cwd();
		} else {
			delete process.env.EXTENSION_DEV_PATH;
		}
		const runner = new VSRunner(
			this.getExecutablePath(),
			literalVersion,
			this.releaseType,
			runOptions.config,
			runOptions.customPageObjects,
			this.parseSettings(runOptions.settings ?? DEFAULT_RUN_OPTIONS.settings),
			runOptions.cleanup,
			runOptions.locale,
		);
		try {
			return await runner.runTests(testFilesPattern, this, runOptions.resources, runOptions.logLevel);
		} finally {
			// Restore the original process environment
			for (const envKey of Object.keys(process.env)) {
				if (!(envKey in savedEnv)) {
					delete process.env[envKey];
				}
			}
			Object.assign(process.env, savedEnv);
		}
	}

	/**
	 * Finds the version of chromium used for given VS Code version.
	 * Works only for versions 1.30+, older versions need to be checked manually
	 *
	 * @param codeVersion version of VS Code, default latest
	 * @param quality release stream, default stable
	 */
	async getChromiumVersion(codeVersion: string = 'latest'): Promise<string> {
		await this.checkCodeVersion(codeVersion);
		const literalVersion = codeVersion === 'latest' ? this.availableVersions[0] : codeVersion;

		// Prefer asking the installed binary itself: in ELECTRON_RUN_AS_NODE mode
		// process.versions.chrome carries the exact bundled Chromium version, which
		// avoids the network round-trip and cgmanifest's structure assumptions.
		// Only trusted when the installed version is the one being asked about.
		try {
			if (this.getExistingCodeVersion() === literalVersion) {
				const localChromium = this.getChromiumVersionFromBinary();
				if (localChromium) {
					return localChromium;
				}
			}
		} catch {
			// no usable local installation — fall through to the manifest lookup
		}

		let revision = literalVersion;
		if (literalVersion.endsWith('-insider')) {
			if (codeVersion === 'latest') {
				revision = 'main';
			} else {
				revision = literalVersion.substring(0, literalVersion.indexOf('-insider'));
				revision = `release/${revision.substring(0, revision.lastIndexOf('.'))}`;
			}
		} else {
			revision = `release/${revision.substring(0, revision.lastIndexOf('.'))}`;
		}

		const fileName = 'manifest.json';
		const url = `https://raw.githubusercontent.com/Microsoft/vscode/${revision}/cgmanifest.json`;

		try {
			// the download must stay inside the try block so that a network failure
			// can still fall back to the offline lookup below
			await Download.getFile(url, path.join(this.downloadFolder, fileName));
			const manifestPath = path.join(this.downloadFolder, fileName);
			const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
			const version = CodeUtil.parseChromiumVersionFromManifest(manifest);
			if (!version) {
				throw new Error('No Chromium registration found in cgmanifest.json');
			}
			return version;
		} catch {
			let version = '';
			if (await fs.pathExists(this.codeFolder)) {
				version = this.getChromiumVersionOffline();
			}
			if (version === '') {
				throw new Error('Unable to determine required ChromeDriver version');
			}
			return version;
		}
	}

	/**
	 * Pull the bundled Chromium version out of VS Code's cgmanifest.json.
	 * The chromium registration is matched by name — its position in the
	 * registrations array is not guaranteed — keeping the historical
	 * first-entry behavior as a fallback.
	 */
	static parseChromiumVersionFromManifest(manifest: unknown): string | undefined {
		const registrations = (manifest as { registrations?: { version?: string; component?: { git?: { name?: string } } }[] } | undefined)?.registrations;
		if (!Array.isArray(registrations) || registrations.length === 0) {
			return undefined;
		}
		const chromium = registrations.find((reg) => reg?.component?.git?.name === 'chromium') ?? registrations[0];
		return chromium?.version;
	}

	/**
	 * Read the Chromium version straight from the installed VS Code binary:
	 * in ELECTRON_RUN_AS_NODE mode process.versions still exposes the baked-in
	 * chrome version. Returns undefined when the binary cannot be executed or
	 * does not report one.
	 */
	private getChromiumVersionFromBinary(): string | undefined {
		const script = 'console.log(process.versions.chrome)';
		let out: Buffer;
		try {
			const command = `${this.cliEnv} "${this.getExecutablePath()}"`;
			out = childProcess.execSync(`${command} -e "${script}"`, { env: this.env, timeout: 30_000 });
		} catch {
			return undefined;
		}
		const version = out.toString().trim().split('\n').pop()?.trim() ?? '';
		return /^\d+(\.\d+){3}$/.test(version) ? version : undefined;
	}

	/**
	 * Check if VS Code exists in local cache along with an appropriate version of chromedriver
	 * without internet connection
	 */
	checkOfflineRequirements(): string {
		try {
			this.getExistingCodeVersion();
		} catch (err) {
			console.log('ERROR: Cannot find a local copy of VS Code in offline mode, exiting.');
			throw err;
		}
		return this.getChromiumVersionOffline();
	}

	/**
	 * Attempt to get chromium version from a downloaded copy of vs code
	 */
	getChromiumVersionOffline(): string {
		const manifestPath = path.join(this.codeFolder, 'resources', 'app', 'ThirdPartyNotices.txt');
		const text = fs.readFileSync(manifestPath).toString();
		const matches = new RegExp(/chromium\sversion\s(.*)\s\(/).exec(text);
		if (matches?.[1]) {
			return matches[1];
		}
		return '';
	}

	/**
	 * Get the root folder of VS Code instance
	 */
	getCodeFolder(): string {
		return this.codeFolder;
	}

	/**
	 * Getter for coverage enablement option
	 */
	get coverageEnabled() {
		return this.coverage;
	}

	/**
	 * Check if given version is available in the given stream
	 */
	private async checkCodeVersion(vscodeVersion: string): Promise<void> {
		if (this.availableVersions.length < 1) {
			this.availableVersions = await this.getVSCodeVersions();
		}
		if (vscodeVersion !== 'latest' && !this.availableVersions.includes(vscodeVersion)) {
			throw new Error(`Version ${vscodeVersion} is not available in ${this.releaseType} stream`);
		}
	}

	/**
	 * Check what VS Code version is present in the testing folder
	 */
	private getExistingCodeVersion(): string {
		if (this.cachedCodeVersion) {
			return this.cachedCodeVersion;
		}
		const command = `${this.cliEnv} "${this.getExecutablePath()}" "${this.getCliPath()}"`;
		const out = childProcess.execSync(`${command} -v`, { env: this.env, timeout: 30_000 });
		this.cachedCodeVersion = out.toString().split('\n')[0];
		return this.cachedCodeVersion;
	}

	/**
	 * Construct the platform string based on OS
	 */
	private getPlatform(): string {
		let platform: string = process.platform;
		const arch = process.arch;
		this.cliEnv = 'ELECTRON_RUN_AS_NODE=1';

		if (platform === 'linux') {
			platform += arch === 'ia32' ? '-ia32' : `-${arch}`;
		} else if (platform === 'win32') {
			switch (arch) {
				case 'arm64': {
					platform += '-arm64';
					break;
				}
				case 'x64': {
					platform += '-x64';
					break;
				}
				default: {
					throw new Error(`Unknown Platform: ${arch}`);
				}
			}
			platform += '-archive';
			this.cliEnv = `set ${this.cliEnv} &&`;
		} else if (platform === 'darwin') {
			platform += '-universal';
		}

		return platform;
	}

	/**
	 * Get the executable path, resolving the macOS binary name lazily after download.
	 * VS Code 1.131+ renamed Contents/MacOS/Electron to Contents/MacOS/Code on macOS.
	 * On other platforms the path is fixed at construction time.
	 * Resolution is deferred until one of the candidates actually exists on disk
	 * (i.e. after VS Code has been downloaded and unpacked).
	 */
	private getExecutablePath(): string {
		if (process.platform === 'darwin' && !this.macExecutableResolved) {
			const newPath = path.join(this.codeFolder, 'Contents', 'MacOS', 'Code');
			const legacyPath = path.join(this.codeFolder, 'Contents', 'MacOS', 'Electron');
			if (fs.existsSync(newPath)) {
				this.executablePath = newPath;
				this.macExecutableResolved = true;
			} else if (fs.existsSync(legacyPath)) {
				this.executablePath = legacyPath;
				this.macExecutableResolved = true;
			}
			// neither exists yet (pre-download) — leave executablePath as-is and retry next call
		}
		return this.executablePath;
	}

	/**
	 * Setup paths specific to used OS
	 */
	private findExecutables(): void {
		this.cliPath = path.join(this.codeFolder, 'resources', 'app', 'out', 'cli.js');
		switch (process.platform) {
			case 'darwin':
				// Resolved lazily in getMacExecutablePath() after download —
				// VS Code 1.131+ renamed Contents/MacOS/Electron to Contents/MacOS/Code
				this.executablePath = path.join(this.codeFolder, 'Contents', 'MacOS', 'Electron');
				this.cliPath = path.join(this.codeFolder, 'Contents', 'Resources', 'app', 'out', 'cli.js');
				break;
			case 'win32':
				this.executablePath = path.join(this.codeFolder, 'Code.exe');
				if (this.releaseType === ReleaseQuality.Insider) {
					this.executablePath = path.join(this.codeFolder, 'Code - Insiders.exe');
				}
				// CLI path resolved lazily in getCliPath() after download (1.109+ uses random subfolder)
				break;
			case 'linux':
				this.executablePath = path.join(this.codeFolder, 'code');
				if (this.releaseType === ReleaseQuality.Insider) {
					this.executablePath = path.join(this.codeFolder, 'code-insiders');
				}
				break;
		}
	}

	/**
	 * Resolve CLI path on Windows. Since VS Code 1.109 the resources folder may live under
	 * a randomly named parent folder (commit-hash based). Prefer legacy path, then search.
	 */
	private findWindowsCliPath(): string {
		const legacyPath = path.join(this.codeFolder, 'resources', 'app', 'out', 'cli.js');
		if (fs.existsSync(legacyPath)) {
			return legacyPath;
		}
		try {
			const entries = fs.readdirSync(this.codeFolder, { withFileTypes: true });
			for (const entry of entries) {
				if (entry.isDirectory()) {
					const candidate = path.join(this.codeFolder, entry.name, 'resources', 'app', 'out', 'cli.js');
					if (fs.existsSync(candidate)) {
						return candidate;
					}
				}
			}
		} catch {
			// fallback to legacy path even if missing, caller will get a clear error
		}
		return legacyPath;
	}

	/**
	 * Parse JSON from a file
	 * @param path path to json file
	 */
	private parseSettings(path: string): object {
		if (!path) {
			return {};
		}
		let text = '';
		try {
			text = fs.readFileSync(path).toString();
		} catch (err) {
			throw new Error(`Unable to read settings from ${path}:\n ${err}`);
		}
		try {
			return JSON.parse(text);
		} catch (err) {
			throw new Error(`Error parsing the settings file from ${path}:\n ${err}`);
		}
	}
}
