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
import { StatusBar, EditorView, InputBox, QuickOpenBox, Workbench, VSBrowser } from 'vscode-extension-tester';

describe('StatusBar', () => {
	let bar: StatusBar;

	before(async function () {
		this.timeout(30000);
		await new Workbench().executeCommand('Create: New File...');
		await (await InputBox.create()).selectQuickPick('Text File');
		bar = new StatusBar();
	});

	after(async () => {
		await new EditorView().closeAllEditors();
	});

	it('can open and close the notification center', async () => {
		const center = await bar.openNotificationsCenter();
		expect(await center.isDisplayed()).is.true;

		await bar.closeNotificationsCenter();
		expect(await center.isDisplayed()).is.false;
	});

	it('openLanguageSelection works', async () => {
		await bar.openLanguageSelection();
		const input = await InputBox.create();
		expect(await input.getPlaceHolder()).equals('Select Language Mode');
		await input.cancel();
	});

	it('getCurrentLanguage returns editor mode', async () => {
		const mode = await bar.getCurrentLanguage();
		expect(mode.startsWith('Plain Text')).is.true;
	});

	it('openLineEndingSelection works', async () => {
		await bar.openLineEndingSelection();
		const input = await InputBox.create();
		expect(await input.getPlaceHolder()).equals('Select End of Line Sequence');
		await input.cancel();
	});

	it('getCurrentLineEnding returns current line ending', async () => {
		const lf = await bar.getCurrentLineEnding();
		expect('CRLF').has.string(lf);
	});

	it('openEncodingSelection works', async () => {
		await bar.openEncodingSelection();
		const input = await InputBox.create();
		expect(await input.getPlaceHolder()).equals('Select File Encoding to Save with');
		await input.cancel();
	});

	it('getCurrentEncoing returns current encoding', async () => {
		const encoding = await bar.getCurrentEncoding();
		expect(encoding).has.string('UTF-8');
	});

	it('openIndentationSelection works', async () => {
		await bar.openIndentationSelection();
		const input = await InputBox.create();
		expect(await input.getPlaceHolder()).equals('Select Action');
		await input.cancel();
	});

	it('getCurrentIndentation returns current indent setting', async () => {
		const encoding = await bar.getCurrentIndentation();
		expect(encoding).has.string('Spaces: 4');
	});

	it('openLineSelection works', async () => {
		await bar.openLineSelection();
		let input: QuickOpenBox | InputBox;
		if (compareVersions(VSBrowser.instance.version, '1.44.0') >= 0) {
			input = await InputBox.create();
		} else {
			input = await QuickOpenBox.create();
		}
		expect(await input.isDisplayed()).is.true;
		await input.cancel();
	});

	it('getCurrentPosition returns current editor coordinates', async () => {
		const encoding = await bar.getCurrentPosition();
		expect(encoding).has.string('Ln 1, Col 1');
	});

	it('getItems works', async () => {
		const items = await bar.getItems();
		expect(items).not.empty;
	});

	it('getItem works', async () => {
		const item = await bar.getItem('UTF-8');
		expect(item).not.undefined;
	});
});
