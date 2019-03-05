'use strict';

import { CodeUtil, ReleaseQuality } from './util/codeUtil';
import { DriverUtil } from './util/driverUtil';
import * as path from 'path';
import * as fs from 'fs-extra';

export { VSBrowser } from './webdriver/browser';

/**
 * VSCode Extension Tester
 */
export class ExTester {
    private code: CodeUtil;
    private chrome: DriverUtil;

    constructor(storageFolder: string = 'test-resources') {
        this.code = new CodeUtil(storageFolder);
        this.chrome = new DriverUtil(storageFolder);
    }

    /**
     * Download VSCode of given version and release quality stream
     * @param version version to download, default latest
     * @param quality quality stream, only acceptable values are 'stable' and 'insider', default stable
     */
    async downloadCode(version: string = 'latest', quality: string = 'stable'): Promise<void> {
        const quality1 = quality === 'insider' ? ReleaseQuality.Insider : ReleaseQuality.Stable;

        return this.code.downloadVSCode(version, quality1);
    }

    /**
     * Install the extension into the test instance of VS Code
     * @param vsixFile path to extension .vsix file. If not set, default vsce path will be used
     */
    installVsix(vsixFile?: string): void {
        if (!vsixFile) {
            const pjson = require(path.resolve('package.json'));
            const vsixPath = path.resolve(`${pjson.name}-${pjson.version}.vsix`);
            if (!fs.existsSync(vsixPath)) {
                this.code.packageExtension();
            }
        } else if (!fs.existsSync(vsixFile)) {
            throw new Error(`File ${vsixFile} does not exist`);
        }
        return this.code.installExtension(vsixFile);
    }

    /**
     * Download the matching chromedriver for a given VS Code version
     * @param vscodeVersion selected versio nof VSCode, default latest
     * @param vscodeStream VSCode release stream, default stable
     */
    async downloadChromeDriver(vscodeVersion: string = 'latest', vscodeStream: string = 'stable'): Promise<void> {
        const quality = vscodeStream === 'insider' ? ReleaseQuality.Insider : ReleaseQuality.Stable;
        const chromiumVersion = await this.code.getChromiumVersion(vscodeVersion, quality);
        await this.chrome.downloadChromeDriverForChromiumVersion(chromiumVersion);
    }

    /**
     * Performs all necessary setup: getting VSCode + ChromeDriver 
     * and packaging/installing extension into the test instance
     * 
     * @param vscodeVersion version of VSCode to test against, default latest
     * @param vscodeStream whether to use stable or insiders build, default stable
     * @param vsixPath path to your packaged extension, when unset, will attempt to use the default vsix filename convention.
     * If no such file exists, will attempt to perform vsce package first.
     */
    async setupRequirements(vscodeVersion: string = 'latest', vscodeStream: string = 'stable', vsixPath?: string): Promise<void> {
        const quality = vscodeStream === 'insider' ? ReleaseQuality.Insider : ReleaseQuality.Stable;
        await this.downloadCode(vscodeVersion, quality);
        await this.downloadChromeDriver(vscodeVersion, vscodeStream);
        this.installVsix(vsixPath);
    }

    /**
     * Performs requirements setup and runs extension tests
     * 
     * @param vscodeVersion version of VSCode to test against, default latest
     * @param vscodeStream whether to use stable or insiders build, default stable
     * @param testFilesPattern glob pattern for test files to run
     * @param vsixPath path to your packaged extension, when unset, will attempt to use the default vsix filename convention.
     * If no such file exists, will attempt to perform vsce package first.
     */
    async setupAndRunTests(vscodeVersion: string = 'latest', vscodeStream: string = 'stable', testFilesPattern: string, vsixPath?: string): Promise<void> {
        await this.setupRequirements(vscodeVersion, vscodeStream, vsixPath);
        this.runTests(testFilesPattern);
    }

    /**
     * Runs the selected test files in VS Code using mocha and webdriver
     * @param testFilesPattern glob pattern for selected test files
     */
    runTests(testFilesPattern: string): void {
        return this.code.runTests(testFilesPattern);
    }
}