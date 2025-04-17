import { ActivityBar, EditorView, ViewSection, Workbench } from 'vscode-extension-tester';
import {
	EXTESTER_RUNNER,
	SCREENSHOTS_VIEW,
	SCREENSHOTS_VIEW_NO_SCREENSHOTS,
	TESTS_VIEW_NO_TESTS,
	TESTS_VIEW,
	LOGS_VIEW,
	LOGS_VIEW_NO_LOGS,
	COLLAPSE_ALL_BTN,
	TEST_VIEW_REFRESH_BTN,
	SCREENSHOTS_VIEW_REFRESH_BTN,
	LOGS_VIEW_REFRESH_BTN,
	TEMP_FOLDER_SETTINGS_ID,
} from './utils/testUtils';
import { assert } from 'chai';

let originalValue: string | boolean | undefined; // could be string, boolean, etc.

before(async function () {
	this.timeout(10000);

	const workbench = new Workbench();
	const settingsEditor = await workbench.openSettings();
	const setting = await settingsEditor.findSettingByID(TEMP_FOLDER_SETTINGS_ID);
	const testValue = `temp-${Math.random().toString(36).substring(2, 10)}`; // random folder for empty logs and screenshots

	if (setting) {
		originalValue = await setting.getValue();
		await setting.setValue(testValue);
	} else {
		throw new Error('Setting not found');
	}

	const editorView = new EditorView();
	await editorView.closeAllEditors();
});

after(async function () {
	this.timeout(10000);

	if (originalValue) {
		const workbench = new Workbench();
		const settingsEditor = await workbench.openSettings();
		const setting = await settingsEditor.findSettingByID(TEMP_FOLDER_SETTINGS_ID);

		await setting.setValue(originalValue);

		const editorView = new EditorView();
		await editorView.closeAllEditors();
	}
});

describe('UI Tests view', function () {
	let section: ViewSection;

	before(async function () {
		section = await getSection(0);
	});

	it('has right title', async function () {
		const title = await section.getTitle();
		assert.equal(title, TESTS_VIEW);
	});

	it('shows no tests message', async function () {
		const visibleItems = await section.getVisibleItems();
		assert.equal(visibleItems.length, 1);

		const item = visibleItems[0];
		assert.equal(await item.getText(), TESTS_VIEW_NO_TESTS);
	});

	it('action buttons are correct', async function () {
		const actions = await section.getActions();
		assert.equal(actions.length, 2);

		const [refreshBtn, collapseBtn] = actions;

		assert.equal(await refreshBtn.getLabel(), TEST_VIEW_REFRESH_BTN);
		assert.equal(await refreshBtn.isEnabled(), true);

		assert.equal(await collapseBtn.getLabel(), COLLAPSE_ALL_BTN);
		assert.equal(await collapseBtn.isEnabled(), false);
	});
});

describe('Screenshots view', function () {
	let section: ViewSection;

	before(async function () {
		section = await getSection(1);
	});

	it('has right title', async function () {
		const title = await section.getTitle();
		assert.equal(title, SCREENSHOTS_VIEW);
	});

	it('shows no tests message', async function () {
		const visibleItems = await section.getVisibleItems();
		assert.equal(visibleItems.length, 1);

		const item = visibleItems[0];
		assert.equal(await item.getText(), SCREENSHOTS_VIEW_NO_SCREENSHOTS);
	});

	it('action buttons are correct', async function () {
		const actions = await section.getActions();
		assert.equal(actions.length, 1);

		const [refreshBtn] = actions;

		assert.equal(await refreshBtn.getLabel(), SCREENSHOTS_VIEW_REFRESH_BTN);
		assert.equal(await refreshBtn.isEnabled(), true);
	});
});

describe('Logs view', function () {
	let section: ViewSection;

	before(async function () {
		section = await getSection(2);
	});

	it('has right title', async function () {
		const title = await section.getTitle();
		assert.equal(title, LOGS_VIEW);
	});

	it('shows no tests message', async function () {
		const visibleItems = await section.getVisibleItems();
		assert.equal(visibleItems.length, 1);

		const item = visibleItems[0];
		assert.equal(await item.getText(), LOGS_VIEW_NO_LOGS);
	});

	it('action buttons are correct', async function () {
		const actions = await section.getActions();
		assert.equal(actions.length, 2);

		const [refreshBtn, collapseBtn] = actions;

		assert.equal(await refreshBtn.getLabel(), LOGS_VIEW_REFRESH_BTN);
		assert.equal(await refreshBtn.isEnabled(), true);

		assert.equal(await collapseBtn.getLabel(), COLLAPSE_ALL_BTN);
		assert.equal(await collapseBtn.isEnabled(), false);
	});
});

async function getSection(sectionIndex: number): Promise<ViewSection> {
	const runnerView = await (await new ActivityBar().getViewControl(EXTESTER_RUNNER))?.openView();
	const content = await (await runnerView?.getContent())?.getSections();
	assert.ok(content && content.length > sectionIndex, `Content section at index ${sectionIndex} is unavailable`);
	return content[sectionIndex];
}
