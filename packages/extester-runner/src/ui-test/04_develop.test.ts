import * as assert from 'assert';
import { EditorView, VSBrowser, Workbench } from 'vscode-extension-tester';
import { EXAMPLE_PROJECT, TEST_FILE_GLOB_SETTINGS_ID } from './utils/testUtils';

const TEST_FILE_GLOB = '**/actions/*.test.ts';
// const ACTIONS_FOLDER = process.platform === 'win32' ? 'src\\actions' : 'src/actions';

describe.only('Screenshots view test suite', function () {
	let originalTestFileGlobValue: string;
	this.timeout(999960000);

	/**
	 * Helper function to update the test file glob setting
	 *
	 * @param value The new value for the test file glob setting
	 */
	async function updateSettings(value: string): Promise<void> {
		const workbench = new Workbench();
		const settingsEditor = await workbench.openSettings();
		const settingControl = await settingsEditor.findSettingByID(TEST_FILE_GLOB_SETTINGS_ID);
		if (!settingControl) {
			throw new Error(`Setting not found: ${TEST_FILE_GLOB_SETTINGS_ID}`);
		}
		originalTestFileGlobValue = (await settingControl.getValue()) as string;
		await settingControl.setValue(value);
	}

	before(async function () {
		this.timeout(30000);
		await updateSettings(TEST_FILE_GLOB);

		const editorView = new EditorView();
		await editorView.closeAllEditors();

		const browser = VSBrowser.instance;
		await browser.openResources(EXAMPLE_PROJECT);
	});

	after(async function () {
		this.timeout(15000);
		await updateSettings(originalTestFileGlobValue);
	});

	it('simple assert', async function () {
		await new Promise((res) => setTimeout(res, 99999999));
		assert.ok(true);
	});
});
