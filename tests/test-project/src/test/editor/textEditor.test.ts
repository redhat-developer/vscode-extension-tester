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

import * as path from 'node:path';
import { expect } from 'chai';
import {
	TextEditor,
	EditorView,
	StatusBar,
	InputBox,
	ContentAssist,
	Workbench,
	FindWidget,
	VSBrowser,
	after,
	before,
	afterEach,
	beforeEach,
} from 'vscode-extension-tester';
import { satisfies } from 'compare-versions';
import { getWaitHelper, waitFor } from '../testUtils';

describe('ContentAssist', async function () {
	let assist: ContentAssist;
	let editor: TextEditor;

	before(async () => {
		this.timeout(30000);
		const wait = getWaitHelper();
		await VSBrowser.instance.openResources(path.resolve(__dirname, '..', '..', '..', 'resources', 'test-file.ts'), async () => {
			await wait.sleep(3000);
		});
		await VSBrowser.instance.waitForWorkbench();
		const ew = new EditorView();
		try {
			await ew.closeEditor('Welcome');
		} catch (error) {
			// continue - Welcome page is not displayed
		}
		editor = (await ew.openEditor('test-file.ts')) as TextEditor;
		// Wait for JS/TS language features to initialize
		await waitFor(
			async () => {
				const progress = await new StatusBar().getItem('Initializing JS/TS language features');
				return !progress;
			},
			{ timeout: this.timeout() - 2000, message: 'Initializing JS/TS language features was not finished yet!' },
		);
	});

	beforeEach(async () => {
		this.timeout(8000);
		const wait = getWaitHelper();
		assist = (await editor.toggleContentAssist(true)) as ContentAssist;
		// Wait for content assist to stabilize
		await wait.forStable(assist, { timeout: 2500 });
	});

	afterEach(async function () {
		const wait = getWaitHelper();
		await editor.toggleContentAssist(false);
		await wait.sleep(500); // Brief wait for assist to close
	});

	after(async function () {
		await new EditorView().closeAllEditors();
	});

	it('getItems retrieves the suggestions', async function () {
		const items = await assist.getItems();
		expect(items).not.empty;
	});

	it('getItem retrieves suggestion by text', async function () {
		const item = await assist.getItem('AbortController');
		expect(await item?.getLabel()).equals('AbortController');
	});

	it('getItem can find an item beyond visible range', async function () {
		const item = await assist.getItem('Buffer');
		expect(item).not.undefined;
	}).timeout(15000);

	it('hasItem finds items beyond visible range', async function () {
		const exists = await assist.hasItem('Error');
		expect(exists).is.true;
	}).timeout(15000);
});

describe('TextEditor', function () {
	let editor: TextEditor;
	let view: EditorView;

	const testText = process.platform === 'win32' ? `line1\r\nline2\r\nline3` : `line1\nline2\nline3`;

	before(async () => {
		this.timeout(8000);
		await new Workbench().executeCommand('Create: New File...');
		await (await InputBox.create()).selectQuickPick('Text File');
		// Wait for editor to be ready
		await waitFor(
			async () => {
				const ew = new EditorView();
				const titles = await ew.getOpenEditorTitles();
				return titles.length > 0;
			},
			{ timeout: 5000, message: 'Editor did not open' },
		);
		view = new EditorView();
		editor = new TextEditor(view);

		await new StatusBar().openLanguageSelection();
		const input = await InputBox.create();
		await input.setText('typescript');
		await input.confirm();
	});

	after(async function () {
		await editor.clearText();
		await view.closeAllEditors();
	});

	it('can get and set text', async function () {
		await editor.setText(testText);
		const text = await editor.getText();
		expect(text).equals(testText);
	});

	it('can get and set text at line', async function () {
		await editor.setTextAtLine(2, 'line5');
		const line = await editor.getTextAtLine(2);
		expect(line).has.string('line5');
	});

	it('can type text at given coordinates', async function () {
		this.timeout(5000);
		await editor.typeTextAt(1, 6, '1');
		const line = await editor.getTextAtLine(1);
		expect(line).has.string('line11');
	});

	it('getCoordinates works', async function () {
		this.timeout(15000);

		await editor.setCursor(1, 1);
		expect(await editor.getCoordinates()).to.deep.equal([1, 1]);

		const lineCount = await editor.getNumberOfLines();
		const lastLine = await editor.getTextAtLine(lineCount);

		await editor.setCursor(lineCount, lastLine.length);
		expect(await editor.getCoordinates()).to.deep.equal([lineCount, lastLine.length]);
	});

	it('getNumberOfLines works', async function () {
		const lines = await editor.getNumberOfLines();
		expect(lines).equals(3);
	});

	it('toggleContentAssist works', async function () {
		this.timeout(15000);
		const assist = (await editor.toggleContentAssist(true)) as ContentAssist;
		expect(await assist.isDisplayed()).is.true;

		await editor.toggleContentAssist(false);
	});

	it('getTab works', async function () {
		const tab = await editor.getTab();
		expect(await tab.getTitle()).equals(await editor.getTitle());
	});

	(process.platform === 'darwin' && satisfies(VSBrowser.instance.version, '<1.101.0') ? it.skip : it)('formatDocument works', async function () {
		expect(await editor.formatDocument()).not.to.throw;
	});

	describe('move/set cursor', function () {
		const params = [
			{ file: 'file-with-spaces.ts', indent: 'spaces' },
			{ file: 'file-with-tabs.ts', indent: 'tabs' },
		];

		for (const param of params) {
			describe(`file using ${param.indent}`, function () {
				let editor: TextEditor;
				let ew: EditorView;

				beforeEach(async function () {
					const wait = getWaitHelper();
					await VSBrowser.instance.openResources(path.resolve(__dirname, '..', '..', '..', 'resources', param.file), async () => {
						await wait.sleep(3000);
					});
					ew = new EditorView();
					// Wait for editor to be available
					await waitFor(async () => (await ew.getOpenEditorTitles()).includes(param.file), {
						timeout: 10_000,
						message: `Unable to find opened editor with title '${param.file}'`,
					});
					editor = (await ew.openEditor(param.file)) as TextEditor;
				});

				for (const coor of [
					[2, 5],
					[3, 9],
				]) {
					it(`move cursor to position [Ln ${coor[0]}, Col ${coor[1]}]`, async function () {
						this.timeout(30000);
						await editor.moveCursor(coor[0], coor[1]);
						expect(await editor.getCoordinates()).to.deep.equal(coor);
					});
				}

				// set cursor using command prompt is not working properly for tabs indentation in VS Code, see https://github.com/microsoft/vscode/issues/198780
				for (const coor of [
					[2, 12],
					[3, 15],
				]) {
					(param.indent === 'tabs' ? it.skip : it)(`set cursor to position [Ln ${coor[0]}, Col ${coor[1]}]`, async function () {
						this.timeout(30000);
						await editor.setCursor(coor[0], coor[1]);
						expect(await editor.getCoordinates()).to.deep.equal(coor);
					});
				}
			});
		}
	});

	describe('searching', function () {
		before(async function () {
			const ew = new EditorView();
			const editors = await ew.getOpenEditorTitles();
			editor = (await ew.openEditor(editors[0])) as TextEditor;
			await editor.setText('aline\nbline\ncline\ndline\nnope\neline1 eline2\nnope again\nfline');
		});

		it('getLineOfText works', async function () {
			const line = await editor.getLineOfText('line');
			expect(line).equals(1);
		});

		it('getLineOfText finds multiple occurrences', async function () {
			const line = await editor.getLineOfText('line', 5);
			expect(line).equals(6);
		});

		it('getLineOfText finds multiple occurrences on the same line', async function () {
			const line = await editor.getLineOfText('line', 6);
			expect(line).equals(6);
		});

		it('getLineOfText returns -1 on no line found', async function () {
			const line = await editor.getLineOfText('wat');
			expect(line).equals(-1);
		});

		it('getLineOfText returns last known occurrence if there are fewer than specified', async function () {
			const line = await editor.getLineOfText('line', 15);
			expect(line).equals(8);
		});

		it('selectText selects first occurrence', async function () {
			const text = 'line';
			await editor.selectText(text);
			const cursor = await editor.getCoordinates();
			expect(cursor).to.deep.equal([1, 6]);
		});

		it('selectText selects second occurrence on same line', async function () {
			const text = 'line';
			await editor.selectText(text, 6);
			const cursor = await editor.getCoordinates();
			expect(cursor).to.deep.equal([6, 13]);
		});

		it('selected text can be get', async function () {
			const text = 'bline';
			await editor.selectText(text);
			expect(await editor.getSelectedText()).equals(text);
		});

		it("selectText errors if given text doesn't exist", async function () {
			const text = 'wat';
			try {
				await editor.selectText(text);
			} catch (err) {
				if (err instanceof Error) {
					expect(err.message).has.string(`Text '${text}' not found`);
				} else {
					expect.fail();
				}
			}
		});

		(process.platform === 'darwin' && satisfies(VSBrowser.instance.version, '<1.101.0') ? it.skip : it)('getSelection works', async function () {
			await editor.selectText('cline');
			const selection = await editor.getSelection();

			expect(selection).not.undefined;

			const menu = await selection?.openContextMenu();
			await menu?.close();
		});
	});

	describe('find widget', function () {
		let widget: FindWidget;

		before(async function () {
			widget = await editor.openFindWidget();
		});

		after(async function () {
			await widget.close();
		});

		it('toggleReplace works', async function () {
			const height = (await widget.getRect()).height;
			await widget.toggleReplace(true);
			expect((await widget.getRect()).height).to.be.gt(height);
		});

		it('setSearchText works', async function () {
			await widget.setSearchText('line');
			expect(await widget.getSearchText()).equals('line');
		});

		it('setReplaceText works', async function () {
			await widget.setReplaceText('line1');
			expect(await widget.getReplaceText()).equals('line1');
		});

		it('getResultCount works', async function () {
			const count = await widget.getResultCount();
			expect(count[0]).gte(1);
			expect(count[1]).gt(1);
		});

		it('nextMatch works', async function () {
			const count = (await widget.getResultCount())[0];
			await widget.nextMatch();
			expect((await widget.getResultCount())[0]).equals(count + 1);
		});

		it('previousMatch works', async function () {
			const count = (await widget.getResultCount())[0];
			await widget.previousMatch();
			expect((await widget.getResultCount())[0]).equals(count - 1);
		});

		it('replace works', async function () {
			await widget.replace();
			expect(await editor.getLineOfText('line1')).gt(0);
		});

		it('replace all works', async function () {
			const original = await editor.getText();
			await widget.replaceAll();
			expect(await editor.getText()).not.equals(original);
		});

		it('toggleMatchCase works', async function () {
			await widget.toggleMatchCase(true);
		});

		it('toggleMatchWholeWord works', async function () {
			await widget.toggleMatchWholeWord(true);
		});

		it('toggleUseRegularExpression works', async function () {
			await widget.toggleUseRegularExpression(true);
		});

		it('togglePreserveCase works', async function () {
			await widget.togglePreserveCase(true);
		});
	});

	describe('CodeLens', function () {
		before(async function () {
			const wait = getWaitHelper();
			await new Workbench().executeCommand('Enable CodeLens');
			// older versions of vscode don't fire the update event immediately, give it some encouragement
			// otherwise the lenses end up empty
			await new Workbench().executeCommand('Enable CodeLens');
			// Wait for CodeLens to appear
			await wait.forCondition(
				async () => {
					const lenses = await editor.getCodeLenses();
					return lenses.length > 0;
				},
				{ timeout: 5000, message: 'CodeLens did not appear' },
			);
		});

		after(async function () {
			await new Workbench().executeCommand('Disable Codelens');
			const nc = await new Workbench().openNotificationsCenter();
			await nc.clearAllNotifications();
			await nc.close();
		});

		it('getCodeLens works with index', async function () {
			const lens0 = await editor.getCodeLens(0);
			const lens0Duplicate = await editor.getCodeLens(0);
			const lens1 = await editor.getCodeLens(1);

			expect(await lens0?.getId()).not.equal(await lens1?.getId());
			expect(await lens0?.getId()).equal(await lens0Duplicate?.getId());
		});

		it('getCodeLens works with partial text', async function () {
			const lens = await editor.getCodeLens('Codelens provided');
			expect(await lens?.getText()).has.string('Codelens provided');
			expect(await lens?.getTooltip()).has.string('Tooltip provided');
		});

		it('getCodeLenses works with second in the span', async function () {
			const lens = await editor.getCodeLens(6);
			expect(lens).is.not.undefined;
			expect(await lens?.getText()).has.string('Codelens provided');
			expect(await lens?.getTooltip()).has.string('Tooltip provided');
		});

		it('getCodeLens returns undefined when nothing is found', async function () {
			const lens1 = await editor.getCodeLens('This does not exist');
			expect(lens1).is.undefined;

			const lens2 = await editor.getCodeLens(666);
			expect(lens2).is.undefined;
		});

		it('clicking triggers the lens command', async function () {
			this.timeout(20000);
			const lens = await editor.getCodeLens(2);
			await lens?.click();
			// Wait for notification to appear
			await waitFor(
				async () => {
					const notifications = await new Workbench().getNotifications();
					const messages = await Promise.all(notifications.map(async (notification) => await notification.getMessage()));
					return messages.some((message) => message.includes('CodeLens action clicked'));
				},
				{ timeout: 10_000, message: 'Notification for lens command was not displayed!' },
			);
		});
	});
});
