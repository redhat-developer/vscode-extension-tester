'use strict';

import { CodeUtil, ReleaseQuality } from './util/codeUtil';
import { DriverUtil } from './util/driverUtil';
import * as fs from 'fs-extra';
import * as path from 'path';
import { URL } from 'url';

export { ReleaseQuality }
export { MochaOptions } from 'mocha';
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

export * from './webdriver/components/sidebar/tree/default/DefaultTreeSection';
export * from './webdriver/components/sidebar/tree/default/DefaultTreeItem';
export * from './webdriver/components/sidebar/tree/custom/CustomTreeSection';
export * from './webdriver/components/sidebar/tree/custom/CustomTreeItem';
export * from './webdriver/components/sidebar/extensions/ExtensionsViewSection';
export * from './webdriver/components/sidebar/extensions/ExtensionsViewItem';

export * from './webdriver/components/bottomBar/BottomBarPanel';
export * from './webdriver/components/bottomBar/ProblemsView';
export * from './webdriver/components/bottomBar/Views';
export * from './webdriver/components/statusBar/StatusBar';

export * from './webdriver/components/editor/EditorView';
export * from './webdriver/components/editor/TextEditor';
export * from './webdriver/components/editor/SettingsEditor';
export * from './webdriver/components/editor/DiffEditor';
export * from './webdriver/components/editor/WebView';
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
     * @param vscodeVersion version of VSCode to test against, default latest
     * @param useYarn when true run `vsce package` with the `--yarn` flag
     */
    async setupRequirements(vscodeVersion: string = 'latest', useYarn?: boolean): Promise<void> {
        await this.downloadCode(vscodeVersion);
        await this.downloadChromeDriver(vscodeVersion);
        await this.installVsix({useYarn});
    }

    /**
     * Performs requirements setup and runs extension tests
     * 
     * @param vscodeVersion version of VSCode to test against, default latest
     * @param testFilesPattern glob pattern for test files to run
     * @param settings path to a custom vscode settings json file
     * @param useYarn when true run `vsce package` with the `--yarn` flag
     * @param cleanup true to uninstall the tested extension after the run, false otherwise
     */
    async setupAndRunTests(vscodeVersion: string = 'latest', testFilesPattern: string, settings: string = '', useYarn?: boolean, cleanup?: boolean, config?: string): Promise<void> {
        await this.setupRequirements(vscodeVersion, useYarn);
        await this.runTests(testFilesPattern, vscodeVersion, settings, cleanup, config);
    }

    /**
     * Runs the selected test files in VS Code using mocha and webdriver
     * @param testFilesPattern glob pattern for selected test files
     * @param settings path to a custom vscode settings json file
     * @param vscodeVersion version of VSCode to test against, default latest
     * @param cleanup true to uninstall the tested extension after the run, false otherwise
     */
    async runTests(testFilesPattern: string, vscodeVersion: string = 'latest', settings: string = '', cleanup?: boolean, config?: string): Promise<void> {
        await this.installVsix({ vsixFile: path.join(__dirname, '..', 'resources', 'api-handler.vsix')});
        await this.code.runTests(testFilesPattern, vscodeVersion, settings, cleanup, config);
    }
}