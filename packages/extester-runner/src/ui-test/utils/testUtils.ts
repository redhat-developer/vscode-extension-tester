import path from 'path';
import {
	ActivityBar,
	BottomBarPanel,
	By,
	EditorView,
	ExtensionsViewItem,
	ExtensionsViewSection,
	TerminalView,
	ViewSection,
	WebDriver,
	Workbench,
} from 'vscode-extension-tester';
import { Logger } from '../../logger/logger';

export const RESOURCES: string = path.resolve('src', 'ui-test', 'resources');
export const EXAMPLE_PROJECT: string = path.join(RESOURCES, 'example-project');

// actions
export const ACTIONS_FOLDER = process.platform === 'win32' ? 'src\\actions' : 'src/actions';
export const CREATE_LOG_FILE = 'createLog.test.ts';
export const CREATE_SCREENSHOT_FILE = 'createScreenshot.test.ts';

// parser
export const PARSER_FOLDER = process.platform === 'win32' ? 'src\\parser' : 'src/parser';
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

// defaults
export const TEST_FILE_GLOB_SETTINGS_DEFAULT = '**/ui-test/**/*.test.ts';

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
 * Waits until a specific extension is activated in VS Code
 * @param driver - WebDriver instance
 * @param displayName - Name of the extension to wait for
 * @param timeout - Maximum time to wait in milliseconds (default: 150000)
 * @param interval - Time between checks in milliseconds (default: 500)
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
 * Checks if a specific extension is activated in VS Code
 * @param displayName - Name of the extension to check
 * @returns Promise resolving to true if extension is activated, false otherwise
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

/**
 * Retrieves a specific section from the ExTester Runner view
 * @param sectionIndex - Index of the section to retrieve
 * @returns Promise resolving to the requested ViewSection
 * @throws Error if section is not found or index is out of bounds
 */
export async function getSection(sectionIndex: number): Promise<ViewSection> {
	const runnerView = await (await new ActivityBar().getViewControl(EXTESTER_RUNNER))?.openView();
	const content = await (await runnerView?.getContent())?.getSections();
	if (!content) {
		throw new Error('Content sections not found');
	}
	if (content.length <= sectionIndex) {
		throw new Error(`Content section at index ${sectionIndex} is unavailable`);
	}
	return content[sectionIndex];
}

/**
 * Updates a VS Code setting with a new value
 * @param settingId - ID of the setting to update
 * @param value - New value to set
 * @throws Error if setting is not found
 */
export async function updateSettings(settingId: string, value: string): Promise<void> {
	const workbench = new Workbench();
	const settingsEditor = await workbench.openSettings();
	const settingControl = await settingsEditor.findSettingByID(settingId);
	if (!settingControl) {
		throw new Error(`Setting not found: ${TEST_FILE_GLOB_SETTINGS_ID}`);
	}
	await settingControl.setValue(value);
	const editorView = new EditorView();
	await editorView.closeAllEditors();
}

/**
 * Waits until specific text appears in the terminal
 * @param driver - WebDriver instance
 * @param text - Text to wait for
 * @param timeout - Maximum time to wait in milliseconds (default: 120000)
 * @param interval - Time between checks in milliseconds (default: 2000)
 */
export async function waitUntilTerminalHasText(driver: WebDriver, logger: Logger, text: string, timeout = 120000, interval = 2000): Promise<void> {
	await driver.sleep(interval);
	await driver.wait(
		async function () {
			try {
				const terminal = await activateTerminalView();
				const terminalText = await terminal.getText();
				return terminalText.includes(text);
			} catch (err) {
				logger.error('Error checking terminal text: ' + err);
				return false;
			}
		},
		timeout,
		`Unable to find in terminal text: ${text}`,
		interval,
	);
}

/**
 * Activates the terminal view in VS Code
 * @returns Promise resolving to the TerminalView instance
 */
async function activateTerminalView(): Promise<TerminalView> {
	await new Workbench().executeCommand('Terminal: Focus on Terminal View');
	return await new BottomBarPanel().openTerminalView();
}
