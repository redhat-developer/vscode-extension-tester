import path from 'path';
import { ActivityBar, By, ExtensionsViewItem, ExtensionsViewSection, WebDriver } from 'vscode-extension-tester';

export const RESOURCES: string = path.resolve('src', 'ui-test', 'resources');
export const EXAMPLE_PROJECT: string = path.join(RESOURCES, 'example-project');

// actions
export const CREATE_LOG_FILE = 'createLog.test.ts';
export const CREATE_SCREENSHOT_FILE = 'createScreenshot.test.ts';

// parser
export const COMPLEX_FILE = 'complexFile.test.ts';
export const MULTIPLE_ROOT_DESCRIBES = 'multipleRootDescribes.test.ts';
export const SIMPLE_FILE = 'simpleFile.test.ts';
export const SIMPLE_FILE_WITH_MODIFIERS = 'simpleFileWithModifiers.test.ts';
export const SIMPLE_FILE_WITH_VARIABLES = 'simpleFileWithVariable.test.ts';

export const EXTESTER_RUNNER = 'ExTester Runner';

// view
export const TEST_FILE_GLOB_SETTINGS_ID = 'extesterRunner.testFileGlob';
export const EXCLUDE_GLOB_SETTINGS_ID = 'extesterRunner.excludeGlob';
export const IGNORE_PATH_PART_SETTINGS_ID = 'extesterRunner.ignorePathPart';

// command line
export const OUTPUT_FOLDER_SETTINGS_ID = 'extesterRunner.outputFolder';
export const ROOT_FOLDER_SETTINGS_ID = 'extesterRunner.rootFolder';
export const TEMP_FOLDER_SETTINGS_ID = 'extesterRunner.tempFolder';
export const VSCODE_VERSION_SETTING_ID = 'extesterRunner.visualStudioCode.Version';
export const VSCODE_TYPE_SETTING_ID = 'extesterRunner.visualStudioCode.Type';
export const ADDITIONAL_ARGS_SETTINGS_ID = 'extesterRunner.additionalArgs';

// logs
export const HIDE_EMPTY_LOGS_FOLDERS_SETTINGS_ID = 'extesterRunner.hideEmptyLogFolders';

export const TESTS_VIEW = 'UI Tests';
export const TESTS_VIEW_NO_TESTS = 'No tests';
export const TEST_VIEW_REFRESH_BTN = 'Refresh Tests';

export const SCREENSHOTS_VIEW = 'Screenshots';
export const SCREENSHOTS_VIEW_NO_SCREENSHOTS = 'No screenshots';
export const SCREENSHOTS_VIEW_REFRESH_BTN = 'Refresh Screenshots';

export const LOGS_VIEW = 'Logs';
export const LOGS_VIEW_NO_LOGS = 'No logs';
export const LOGS_VIEW_REFRESH_BTN = 'Refresh Logs';

export const COLLAPSE_ALL_BTN = 'Collapse All';

/**
 * Wait until required extension is activated.
 *
 * @param driver WebDriver.
 * @param displayName Name of extension.
 * @param timeout Timeout for dynamic wait.
 * @param interval Delay between individual checks.
 */
export async function waitUntilExtensionIsActivated(driver: WebDriver, displayName: string, timeout = 150000, interval = 500): Promise<void> {
	await driver.wait(
		async function () {
			return await extensionIsActivated(displayName);
		},
		timeout,
		`The ${displayName} extension was not activated after ${timeout} sec.`,
		interval,
	);
}

/**
 * Checks, if extension is activated.
 *
 * @param displayName Name of extension.
 * @returns true/false
 */
export async function extensionIsActivated(displayName: string): Promise<boolean> {
	try {
		const extensionsView = await (await new ActivityBar().getViewControl('Extensions'))?.openView();
		const marketplace = (await extensionsView?.getContent().getSection('Installed')) as ExtensionsViewSection;
		const item = (await marketplace.findItem(`@installed ${displayName}`)) as ExtensionsViewItem;
		const activationTime = await item.findElement(By.className('activationTime'));

		if (activationTime !== undefined) {
			return true;
		} else {
			return false;
		}
	} catch (err) {
		console.error('Error checking extension activation status:', err);
		return false;
	}
}
