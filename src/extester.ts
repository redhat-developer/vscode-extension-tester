'use strict';

import { CodeUtil, DEFAULT_RUN_OPTIONS, ReleaseQuality, RunOptions } from './util/codeUtil';
import { DriverUtil } from './util/driverUtil';
import * as fs from 'fs-extra';
import * as path from 'path';
import { URL } from 'url';

export { ReleaseQuality }
export { MochaOptions } from 'mocha';
export * from './browser';
export * from './suite/mochaHooks';
export * from 'monaco-page-objects';

export interface SetupOptions {
    /** version of VSCode to test against, defaults to latest */
    vscodeVersion?: string;
    /** when true run `vsce package` with the `--yarn` flag */
    useYarn?: boolean;
    /** install the extension's dependencies from the marketplace. Defaults to `false`. */
    installDependencies?: boolean;
}

export const DEFAULT_SETUP_OPTIONS = {
    vscodeVersion: 'latest',
    installDependencies: false
}

export const VSCODE_VERSION_MIN = '1.81.1';
export const VSCODE_VERSION_MAX = '1.83.1';

/**
 * The latest version of NodeJS which is properly working with selenium-webdriver
 * (for more details, see https://www.npmjs.com/package/selenium-webdriver?activeTab=readme#node-support-policy)
 */
export const NODEJS_VERSION_MAX = '18.15.0';

/**
 * VSCode Extension Tester
 */
export class ExTester {
    private code: CodeUtil;
    private chrome: DriverUtil;

    constructor(storageFolder: string = 'test-resources', releaseType: ReleaseQuality = ReleaseQuality.Stable, extensionsDir?: string) {
        this.code = new CodeUtil(storageFolder, releaseType, extensionsDir);
        this.chrome = new DriverUtil(storageFolder);

        if (process.versions.node > NODEJS_VERSION_MAX) {
            console.log('\x1b[31m%s\x1b[0m', `
                ERROR: You are using the unsupported NodeJS version '${process.versions.node}'. The latest supported version is '${NODEJS_VERSION_MAX}'.
                       We recommend to use supported version to have vscode-extension-tester working properly.
                       More info at https://github.com/redhat-developer/vscode-extension-tester/issues/975
            `);
        }
    }

    /**
     * Download VSCode of given version and release quality stream
     * @param version version to download, default latest
     */
    async downloadCode(version: string = 'latest'): Promise<void> {
        return await this.code.downloadVSCode(loadCodeVersion(version));
    }

    /**
     * Install the extension into the test instance of VS Code
     * @param vsixFile path to extension .vsix file. If not set, default vsce path will be used
     * @param useYarn when true run `vsce package` with the `--yarn` flag
     */
    async installVsix({vsixFile, useYarn, installDependencies}: {vsixFile?: string, useYarn?: boolean, installDependencies?: boolean} = {}): Promise<void> {
        let target = vsixFile;
        if (vsixFile) {
            try {
                const uri = new URL(vsixFile);
                if (!(process.platform === 'win32' && /^\w:/.test(uri.protocol))) {
                    target = path.basename(vsixFile);
                }
            } catch (err) {
                if (!fs.existsSync(vsixFile)) {
                    throw new Error(`File ${vsixFile} does not exist`);
                }
            }
            if (target !== vsixFile) {
                target = await this.code.downloadExtension(vsixFile);
            }
        } else {
            await this.code.packageExtension(useYarn);
        }
        this.code.installExtension(target);
        if (installDependencies) {
            this.code.installDependencies();
        }
    }

    /**
     * Install an extension from VS Code marketplace into the test instance
     * @param id id of the extension to install
     */
    async installFromMarketplace(id: string): Promise<void> {
        return this.code.installExtension(undefined, id);
    }

    /**
     * Download the matching chromedriver for a given VS Code version
     * @param vscodeVersion selected versio nof VSCode, default latest
     */
    async downloadChromeDriver(vscodeVersion: string = 'latest'): Promise<string> {
        const chromiumVersion = await this.code.getChromiumVersion(loadCodeVersion(vscodeVersion));
        return await this.chrome.downloadChromeDriverForChromiumVersion(chromiumVersion);
    }

    /**
     * Performs all necessary setup: getting VSCode + ChromeDriver
     * and packaging/installing extension into the test instance
     *
     * @param options Additional options for setting up the tests
     */
    async setupRequirements(options: SetupOptions = DEFAULT_SETUP_OPTIONS, offline = false): Promise<void> {
        const { useYarn, vscodeVersion, installDependencies } = options;

        const vscodeParsedVersion = loadCodeVersion(vscodeVersion);
        if (!offline) {
            await this.downloadCode(vscodeParsedVersion);
            await this.downloadChromeDriver(vscodeParsedVersion);
        } else {
            console.log('Attempting Setup in offline mode');
            const expectedChromeVersion = (await this.code.checkOfflineRequirements()).split('.')[0];
            const actualChromeVersion = (await this.chrome.checkDriverVersionOffline()).split('.')[0];
            if (expectedChromeVersion !== actualChromeVersion) {
                console.log('\x1b[33m%s\x1b[0m', `WARNING: Local copy of VS Code runs Chromium version ${expectedChromeVersion}, the installed ChromeDriver is version ${actualChromeVersion}.`)
                console.log(`Attempting with ChromeDriver ${actualChromeVersion} anyway. Tests may experience issues due to version mismatch.`);
            }
        }
        await this.installVsix({useYarn});
        if (installDependencies && !offline) {
            this.code.installDependencies();
        }
    }

    /**
     * Performs requirements setup and runs extension tests
     * 
     * @param testFilesPattern glob pattern(s) for test files to run
     * @param vscodeVersion version of VSCode to test against, defaults to latest
     * @param setupOptions Additional options for setting up the tests
     * @param runOptions Additional options for running the tests
     * 
     * @returns Promise resolving to the mocha process exit code - 0 for no failures, 1 otherwise
     */
    async setupAndRunTests(testFilesPattern: string | string[], vscodeVersion: string = 'latest', setupOptions: Omit<SetupOptions, "vscodeVersion"> = DEFAULT_SETUP_OPTIONS, runOptions: Omit<RunOptions, "vscodeVersion"> = DEFAULT_RUN_OPTIONS): Promise<number> {
        await this.setupRequirements({...setupOptions, vscodeVersion}, runOptions.offline);
        return await this.runTests(testFilesPattern, {...runOptions, vscodeVersion});
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
        const patterns = (typeof testFilesPattern === 'string') ? ([testFilesPattern]) : (testFilesPattern);
        return await this.code.runTests(patterns, runOptions);
    }
}

export function loadCodeVersion(version: string | undefined): string {
    const code_version = process.env.CODE_VERSION ? process.env.CODE_VERSION : version;

    if (code_version !== undefined) {
        if (code_version.toLowerCase() === 'max') {
            return VSCODE_VERSION_MAX;
        }
        if (code_version.toLowerCase() === 'min') {
            return VSCODE_VERSION_MIN;
        }
        return code_version;
    }
    return 'latest';
}
