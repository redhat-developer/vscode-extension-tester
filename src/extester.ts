'use strict';

import { CodeUtil, DEFAULT_RUN_OPTIONS, ReleaseQuality, RunOptions } from './util/codeUtil';
import { DriverUtil } from './util/driverUtil';
import * as fs from 'fs-extra';
import * as path from 'path';
import { URL } from 'url';

export { ReleaseQuality }
export { MochaOptions } from 'mocha';
export * from './browser';
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

/**
 * VSCode Extension Tester
 */
export class ExTester {
    private code: CodeUtil;
    private chrome: DriverUtil;

    constructor(storageFolder: string = 'test-resources', releaseType: ReleaseQuality = ReleaseQuality.Stable, extensionsDir?: string) {
        this.code = new CodeUtil(storageFolder, releaseType, extensionsDir);
        this.chrome = new DriverUtil(storageFolder);
    }

    /**
     * Download VSCode of given version and release quality stream
     * @param version version to download, default latest
     */
    async downloadCode(version: string = 'latest'): Promise<void> {
        return this.code.downloadVSCode(version);
    }

    /**
     * Install the extension into the test instance of VS Code
     * @param vsixFile path to extension .vsix file. If not set, default vsce path will be used
     * @param useYarn when true run `vsce package` with the `--yarn` flag
     */
    async installVsix({vsixFile, useYarn}: {vsixFile?: string, useYarn?: boolean} = {}): Promise<void> {
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
            this.code.packageExtension(useYarn);
        }
        return this.code.installExtension(target);
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
    async downloadChromeDriver(vscodeVersion: string = 'latest'): Promise<void> {
        const chromiumVersion = await this.code.getChromiumVersion(vscodeVersion);
        await this.chrome.downloadChromeDriverForChromiumVersion(chromiumVersion);
    }

    /**
     * Performs all necessary setup: getting VSCode + ChromeDriver
     * and packaging/installing extension into the test instance
     *
     * @param options Additional options for setting up the tests
     */
    async setupRequirements(options: SetupOptions = DEFAULT_SETUP_OPTIONS): Promise<void> {
        const { useYarn, vscodeVersion, installDependencies } = options;
        await this.downloadCode(vscodeVersion);
        await this.downloadChromeDriver(vscodeVersion);
        await this.installVsix({useYarn});
        if (installDependencies) {
            this.code.installDependencies();
        }
    }

    /**
     * Performs requirements setup and runs extension tests
     * 
     * @param testFilesPattern glob pattern for test files to run
     * @param vscodeVersion version of VSCode to test against, defaults to latest
     * @param setupOptions Additional options for setting up the tests
     * @param runOptions Additional options for running the tests
     * 
     * @returns Promise resolving to the mocha process exit code - 0 for no failures, 1 otherwise
     */
    async setupAndRunTests(testFilesPattern: string, vscodeVersion: string = 'latest', setupOptions: Omit<SetupOptions, "vscodeVersion"> = DEFAULT_SETUP_OPTIONS, runOptions: Omit<RunOptions, "vscodeVersion"> = DEFAULT_RUN_OPTIONS): Promise<number> {
        await this.setupRequirements({...setupOptions, vscodeVersion});
        return this.runTests(testFilesPattern, {...runOptions, vscodeVersion});
    }

    /**
     * Runs the selected test files in VS Code using mocha and webdriver
     * @param testFilesPattern glob pattern for selected test files
     * @param runOptions Additional options for running the tests
     * 
     * @returns Promise resolving to the mocha process exit code - 0 for no failures, 1 otherwise
     */
    async runTests(testFilesPattern: string, runOptions: RunOptions = DEFAULT_RUN_OPTIONS): Promise<number> {
        await this.installVsix({ vsixFile: path.join(__dirname, '..', 'resources', 'api-handler.vsix')});
        return this.code.runTests(testFilesPattern, runOptions);
    }
}