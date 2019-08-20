'use strict';

import { CodeUtil, ReleaseQuality } from './util/codeUtil';
import { DriverUtil } from './util/driverUtil';
import * as fs from 'fs-extra';

export * from 'selenium-webdriver';
export * from './webdriver/browser';

export * from './webdriver/components/menu/Menu';
export * from './webdriver/components/menu/MenuItem';
export * from './webdriver/components/menu/TitleBar';
export * from './webdriver/components/menu/ContextMenu';
export * from './webdriver/components/menu/WindowControls';

export * from './webdriver/components/activityBar/ActivityBar';
export * from './webdriver/components/activityBar/ViewControl';
export * from './webdriver/components/activityBar/ActionsControl';

export * from './webdriver/components/sidebar/SideBarView';
export * from './webdriver/components/sidebar/ViewTitlePart';
export * from './webdriver/components/sidebar/ViewContent';
export * from './webdriver/components/sidebar/ViewSection';
export * from './webdriver/components/sidebar/ViewItem';

export * from './webdriver/components/bottomBar/BottomBarPanel';
export * from './webdriver/components/bottomBar/ProblemsView';
export * from './webdriver/components/bottomBar/Views';
export * from './webdriver/components/statusBar/StatusBar';

export * from './webdriver/components/editor/EditorView';
export * from './webdriver/components/editor/TextEditor';
export * from './webdriver/components/editor/SettingsEditor';
export * from './webdriver/components/editor/ContentAssist';

export { Notification, NotificationType } from './webdriver/components/workbench/Notification';
export * from './webdriver/components/workbench/NotificationsCenter';
export * from './webdriver/components/workbench/input/Input';
export * from './webdriver/components/workbench/input/InputBox';
export * from './webdriver/components/workbench/input/QuickOpenBox';
export * from './webdriver/components/workbench/Workbench';

export * from './webdriver/native/dialogHandler';
export * from './webdriver/native/nativeDialog';
export { OpenDialog } from './webdriver/native/openDialog';

export * from './webdriver/conditions/WaitForAttribute';

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
            this.code.packageExtension();
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
     */
    async setupRequirements(vscodeVersion: string = 'latest', vscodeStream: string = 'stable'): Promise<void> {
        const quality = vscodeStream === 'insider' ? ReleaseQuality.Insider : ReleaseQuality.Stable;
        await this.downloadCode(vscodeVersion, quality);
        await this.downloadChromeDriver(vscodeVersion, vscodeStream);
        if (process.platform === 'win32') {
            this.installVsix();
        }
    }

    /**
     * Performs requirements setup and runs extension tests
     * 
     * @param vscodeVersion version of VSCode to test against, default latest
     * @param vscodeStream whether to use stable or insiders build, default stable
     * @param testFilesPattern glob pattern for test files to run
     * @param settings path to a custom vscode settings json file
     */
    async setupAndRunTests(vscodeVersion: string = 'latest', vscodeStream: string = 'stable', testFilesPattern: string, settings: string = ''): Promise<void> {
        await this.setupRequirements(vscodeVersion, vscodeStream);
        this.runTests(testFilesPattern, settings);
    }

    /**
     * Runs the selected test files in VS Code using mocha and webdriver
     * @param testFilesPattern glob pattern for selected test files
     * @param settings path to a custom vscode settings json file
     */
    runTests(testFilesPattern: string, settings: string = ''): void {
        return this.code.runTests(testFilesPattern, settings);
    }
}