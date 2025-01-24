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
import { compareVersions } from 'compare-versions';
import { QuickOpenBox, Workbench, QuickPickItem, InputBox, StatusBar, EditorView, VSBrowser } from 'vscode-extension-tester';

describe('QuickOpenBox', () => {
	let input: QuickOpenBox;

	before(async () => {
		input = await new Workbench().openCommandPrompt();
	});

	after(async () => {
		await input.cancel();
	});

	it('selectQuickPick works', async function () {
		this.timeout(5000);
		await input.setText('>hello world');
		await input.selectQuickPick('Hello World');
		expect(await input.isDisplayed()).is.false;
		input = await new Workbench().openCommandPrompt();
	});

	it('can set and retrieve the text', async function () {
		this.timeout(5000);
		const testText = 'test-text';
		await input.setText(testText);
		const text = await input.getText();
		expect(testText).has.string(text);
	});

	it('getPlaceholder returns placeholder text', async function () {
		this.timeout(5000);
		await input.setText('');
		const holder = await input.getPlaceHolder();

		let searchString = `Type '?' to get help`;
		if (compareVersions(VSBrowser.instance.version, '1.44.0') >= 0) {
			searchString = 'Search files by name';
		}
		expect(holder).has.string(searchString);
	});

	it('hasProgress checks for progress bar', async () => {
		const prog = await input.hasProgress();
		expect(prog).is.false;
	});

	it('getQuickPicks finds quick pick options', async () => {
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
		if (compareVersions(VSBrowser.instance.version, '1.44.0') < 0) {
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
		expect((await item.getActions()).length).equals(1);
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
		this.timeout(6000);
		await new Workbench().executeCommand('Create: New File...');
		await (await InputBox.create()).selectQuickPick('Text File');
		await new Promise((res) => setTimeout(res, 500));
		await new StatusBar().openLanguageSelection();
		input = await InputBox.create();
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

describe('Multiple selection input', () => {
	let input: InputBox;

	before(async () => {
		await new Workbench().executeCommand('Test Quickpicks');
		await new Promise((res) => setTimeout(res, 500));
		input = await InputBox.create();
	});

	after(async () => {
		await input.confirm();
	});

	it('Select all works', async () => {
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
