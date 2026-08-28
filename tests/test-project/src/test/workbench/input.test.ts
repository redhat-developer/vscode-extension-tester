/**
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License", destination); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { expect } from 'chai';
import { satisfies } from 'compare-versions';
import { QuickOpenBox, Workbench, QuickPickItem, InputBox, StatusBar, EditorView, VSBrowser } from 'vscode-extension-tester';
import { getWaitHelper, waitFor } from '../testUtils';
import * as path from 'path';

describe('QuickOpenBox', () => {
	let input: QuickOpenBox;

	// Re-open the command prompt before each test so we always hold a fresh,
	// interactable reference. The single shared reference from `before` goes stale
	// after tests that scroll through quick picks or close/reopen the prompt.
	beforeEach(async function () {
		this.timeout(8000);
		try {
			// Close whatever may be open first to get a clean state
			await input?.cancel();
		} catch {
			// ignore – prompt may already be closed
		}
		input = await new Workbench().openCommandPrompt();
	});

	after(async () => {
		try {
			await input?.cancel();
		} catch {
			// ignore
		}
	});

	it('selectQuickPick works', async function () {
		this.timeout(8000);
		await input.setText('>hello world');
		await input.selectQuickPick('Hello World');
		expect(await input.isDisplayed()).is.false;
	});

	it('can set and retrieve the text', async function () {
		this.timeout(8000);
		const testText = 'test-text';
		await input.setText(testText);
		const text = await input.getText();
		expect(testText).has.string(text);
	});

	it('getPlaceholder returns placeholder text', async function () {
		this.timeout(8000);
		await input.setText('');
		const holder = await input.getPlaceHolder();

		let searchString = `Type '?' to get help`;
		if (satisfies(VSBrowser.instance.version, '>=1.44.0')) {
			searchString = 'Search files by name';
		}
		expect(holder).has.string(searchString);
	});

	it('hasProgress checks for progress bar', async function () {
		this.timeout(8000);
		const prog = await input.hasProgress();
		expect(prog).is.false;
	});

	it('getQuickPicks finds quick pick options', async function () {
		this.timeout(8000);
		await input.setText('>hello world');
		const picks = await input.getQuickPicks();
		expect(picks).not.empty;
	});

	it('findQuickPick works when item exists', async function () {
		this.timeout(150000);
		await input.setText('>');
		const pick = await input.findQuickPick('Workspaces: Add Folder to Workspace...');
		expect(pick).not.undefined;
	});

	it('findQuickPick works when item does not exist', async function () {
		this.timeout(150000);
		await input.setText('>');
		const pick = await input.findQuickPick('thisdoesnot exits definitely');
		expect(pick).undefined;
	});
});

describe('QuickPickItem', () => {
	let item: QuickPickItem;
	let input: QuickOpenBox;

	before(async function () {
		this.timeout(5000);
		input = await new Workbench().openCommandPrompt();
		await input.setText('>hello world');
		const picks = await input.getQuickPicks();
		item = picks[0];
	});

	it('getLabel returns label', async () => {
		const text = await item.getLabel();
		expect(text).not.empty;
	});

	it('getIndex returns the index of the item', () => {
		const index = item.getIndex();
		let expected = 0;
		if (satisfies(VSBrowser.instance.version, '<1.44.0')) {
			expected = 1;
		}
		expect(index).equals(expected);
	});

	it('select works', async () => {
		await item.select();
		expect(await input.isDisplayed()).is.false;
	});

	it('getDescription works', async function () {
		this.timeout(8000);
		await new Workbench().executeCommand('Extension Test Command');
		const inputbox = await InputBox.create();
		const pick = (await inputbox.getQuickPicks())[0];
		const desc = await pick.getDescription();
		expect(desc).has.string('Test Description');
	});

	it('getActions works', async function () {
		const prompt = await new Workbench().openCommandPrompt();
		await prompt.setText(`>Extension Test Command`);
		item = (await prompt.getQuickPicks())[0];
		const items = await item.getActions();

		const labels = await Promise.all(items.map((item) => item.getLabel()));
		const filteredItems = items.filter((_, i) => labels[i] !== 'Remove from Recently Used');

		expect(filteredItems).to.have.lengthOf(1);
	});

	it('getLabel of Action Button works', async function () {
		const button = await (await item.getActions()).at(0);
		expect(await button?.getLabel()).to.contain('Configure Keybinding');
	});

	it('getAction works', async function () {
		const button = await item.getAction('Configure Keybinding');
		expect(button).not.undefined;
	});
});

describe('InputBox', () => {
	let input: InputBox;

	before(async function () {
		this.timeout(20000);
		await new Workbench().executeCommand('Create: New File...');
		await (await InputBox.create(8000)).selectQuickPick('Text File');
		// Wait for editor to be ready before opening the language selection
		await waitFor(
			async () => {
				const ew = new EditorView();
				return (await ew.getOpenEditorTitles()).length > 0;
			},
			{ timeout: 8000 },
		);
		await new StatusBar().openLanguageSelection();
		input = await InputBox.create(8000);
	});

	after(async () => {
		await input.cancel();
		await new EditorView().closeAllEditors();
	});

	it('text handling works', async function () {
		this.timeout(5000);
		const text = 'text';
		await input.setText(text);
		expect(await input.getText()).equals(text);

		await input.clear();
		expect(await input.getText()).empty;
	});

	it('getMessage works', async () => {
		const message = await input.getMessage();
		expect(message).empty;
	});

	it('hasProgress works', async () => {
		const prog = await input.hasProgress();
		expect(prog).is.false;
	});

	it('getQuickPicks works', async function () {
		this.timeout(4000);
		const picks = await input.getQuickPicks();
		expect(picks).not.empty;
	});

	it('hasError works', async () => {
		const err = await input.hasError();
		expect(err).is.false;
	});

	it('isPassword works', async () => {
		const pass = await input.isPassword();
		expect(pass).is.false;
	});
});

describe('InputBox - works for path', () => {
	let input: InputBox;

	before(async function () {
		this.timeout(20000);
		await new Workbench().executeCommand('File: Open Folder...');
		input = await InputBox.create(10000);
		const resourcesPath = path.resolve(__dirname, '..', '..', '..', 'resources');
		await input.setText(resourcesPath + path.sep);
	});

	after(async () => {
		await input.cancel();
		await new EditorView().closeAllEditors();
	});

	it('findQuickPick works', async function () {
		let quickpick: QuickPickItem | undefined;
		await waitFor(
			async () => {
				quickpick = await input.findQuickPick('test-folder');
				return quickpick !== undefined;
			},
			{ timeout: 8000, message: 'Could not find quick pick with text "test-folder"' },
		);
		expect(quickpick).to.not.be.undefined;
	});

	it('selectQuickPick works', async function () {
		await input.selectQuickPick('test-folder');
		let quickpick2: QuickPickItem | undefined;
		await waitFor(
			async () => {
				quickpick2 = await input.findQuickPick('foolder');
				return quickpick2 !== undefined;
			},
			{ timeout: 8000, message: 'Could not find quick pick with text "foolder" after selecting "test-folder"' },
		);
		expect(quickpick2).to.not.be.undefined;
	});
});

describe('Multiple selection input', () => {
	let input: InputBox;

	before(async function () {
		this.timeout(15000);
		const wait = getWaitHelper();
		await new Workbench().executeCommand('Test Quickpicks');
		// Wait for input box to appear and stabilize
		input = await InputBox.create(8000);
		await wait.forStable(input, { timeout: 2000 });
	});

	after(async () => {
		await input.cancel();
	});

	it('Select all works', async () => {
		if (satisfies(VSBrowser.instance.version, '>=1.106.0 <1.107.0')) {
			return;
		}
		await input.toggleAllQuickPicks(true);
		const picks = await input.getCheckboxes();
		for (const pick of picks) {
			const selected = await pick.isSelected();
			expect(selected).is.true;
		}
	});

	it('Deselect all works', async () => {
		await input.toggleAllQuickPicks(false);
		const picks = await input.getCheckboxes();
		for (const pick of picks) {
			const selected = await pick.isSelected();
			expect(selected).is.false;
		}
	});

	it('allows retrieving quickpicks', async () => {
		const [first] = await input.getCheckboxes();
		expect(await first.getText()).equals('test1');
		await first.select();
		const checkbox = (await input.getCheckboxes()).at(0);
		expect(await checkbox?.isSelected()).is.true;
	});
});
