import * as assert from 'assert';
import { ActivityBar, BottomBarPanel, EditorView, TerminalView, TreeItem, ViewSection, VSBrowser, WebDriver, Workbench } from 'vscode-extension-tester';
import {
	EXAMPLE_PROJECT,
	EXTESTER_RUNNER,
	OUTPUT_FOLDER_SETTINGS_ID,
	ROOT_FOLDER_SETTINGS_ID,
	SCREENSHOTS_VIEW_NO_SCREENSHOTS,
	TEST_FILE_GLOB_SETTINGS_ID,
} from './utils/testUtils';

const TEST_FILE_GLOB = '**/actions/*.test.ts';
const ACTIONS_FOLDER = process.platform === 'win32' ? 'src\\actions' : 'src/actions';

describe('Screenshots view test suite', function () {
	// let originalTestFileGlobValue: string;
	// let originalRootFolderValue: string;
	// let originalOutValue: string;
	this.timeout(300000);

	let driver: WebDriver;

	/**
	 * Helper function to update the test file glob setting
	 *
	 * @param value The new value for the test file glob setting
	 */
	async function updateSettings(): Promise<void> {
		const workbench = new Workbench();
		const settingsEditor = await workbench.openSettings();

		const settingControl = await settingsEditor.findSettingByID(TEST_FILE_GLOB_SETTINGS_ID);
		if (!settingControl) {
			throw new Error(`Setting not found: ${TEST_FILE_GLOB_SETTINGS_ID}`);
		}
		// originalTestFileGlobValue = (await settingControl.getValue()) as string;
		await settingControl.setValue(TEST_FILE_GLOB);

		const settingControRoot = await settingsEditor.findSettingByID(ROOT_FOLDER_SETTINGS_ID);
		if (!settingControl) {
			throw new Error(`Setting not found: ${ROOT_FOLDER_SETTINGS_ID}`);
		}
		// originalRootFolderValue = (await settingControRoot.getValue()) as string;
		await settingControRoot.setValue('src');

		const settingControlOut = await settingsEditor.findSettingByID(OUTPUT_FOLDER_SETTINGS_ID);
		if (!settingControl) {
			throw new Error(`Setting not found: ${OUTPUT_FOLDER_SETTINGS_ID}`);
		}
		// originalOutValue = (await settingControlOut.getValue()) as string;
		await settingControlOut.setValue('out');
	}

	before(async function () {
		this.timeout(30000);

		driver = VSBrowser.instance.driver;

		const browser = VSBrowser.instance;
		await browser.openResources(EXAMPLE_PROJECT);

		await updateSettings();

		const editorView = new EditorView();
		await editorView.closeAllEditors();
	});

	// after(async function () {
	// 	this.timeout(30000);
	// 	await restoreSettings();
	// });

	// switch to perspective

	// Checkl no screenshots

	// Run file

	// wait until test passed in terminal

	// check file

	it('no screenshot avialble', async function () {
		let section: ViewSection;
		section = await getSection(1);
		const visibleItems = await section.getVisibleItems();
		assert.equal(visibleItems.length, 1);

		const item = visibleItems[0];
		assert.equal(await item.getText(), SCREENSHOTS_VIEW_NO_SCREENSHOTS);
	});

	it('screenshot created', async function () {
		let section: ViewSection;
		section = await getSection(0);

		// Verify parser folder exists
		// const items = await section.getVisibleItems();

		await section.openItem(ACTIONS_FOLDER);
		const item = (await section.findItem('createScreenshot.test.ts')) as TreeItem;

		const btns = await item.getActionButtons();

		await btns.at(0)?.click();

		await waitUntilTerminalHasText(driver, '1 passing', 120_000, 1_000);

		// await new Promise((res) => setTimeout(res, 99999999));

		let screensectrion: ViewSection;
		screensectrion = await getSection(1);

		const visibleItems = await screensectrion.getVisibleItems();
		assert.equal(visibleItems.length, 2);

		// wait until terminal has text

		// 		Launching tests...
		//   Create Screenshot
		//     ✔ Trigger takeScreenshot action (146ms)

		// Shutting down the browser

		//   1 passing (5s)

		// await new Promise((res) => setTimeout(res, 99999999));
	});
});

/**
 * Helper function to retrieve a specific section from the ExTester Runner view
 * @param sectionIndex - The index of the section to retrieve
 * @returns A Promise that resolves to the requested ViewSection
 */
async function getSection(sectionIndex: number): Promise<ViewSection> {
	const runnerView = await (await new ActivityBar().getViewControl(EXTESTER_RUNNER))?.openView();
	const content = await (await runnerView?.getContent())?.getSections();
	assert.ok(content && content.length > sectionIndex, `Content section at index ${sectionIndex} is unavailable`);
	return content[sectionIndex];
}

/**
 * Wait until terminal has text.
 *
 * @param driver WebDriver.
 * @param text Text to be contained in terminal.
 * @param timeout Timeout for dynamic wait.
 * @param interval Delay between individual checks.
 */
async function waitUntilTerminalHasText(driver: WebDriver, text: string, timeout = 120000, interval = 2000): Promise<void> {
	await driver.sleep(interval);
	await driver.wait(
		async function () {
			try {
				const terminal = await activateTerminalView();
				const terminalText = await terminal.getText();
				return terminalText.includes(text);
			} catch (err) {
				return false;
			}
		},
		timeout,
		`Unable to find in terminal text: ${text}`,
		interval,
	);
}

async function activateTerminalView(): Promise<TerminalView> {
	await new Workbench().executeCommand('Terminal: Focus on Terminal View');
	return await new BottomBarPanel().openTerminalView();
}
