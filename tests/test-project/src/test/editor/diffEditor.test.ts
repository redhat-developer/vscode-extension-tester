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

import * as path from 'path';
import { expect } from 'chai';
import { EditorView, Workbench, DiffEditor, QuickOpenBox, InputBox, VSBrowser } from 'vscode-extension-tester';
import { compareVersions } from 'compare-versions';

describe('DiffEditor', async () => {
	let editor: DiffEditor;

	before(async function () {
		this.timeout(250000);
		await VSBrowser.instance.openResources(
			path.resolve(__dirname, '..', '..', '..', 'resources', 'test-file-a.txt'),
			path.resolve(__dirname, '..', '..', '..', 'resources', 'test-file-b.txt'),
		);
		await new EditorView().openEditor('test-file-b.txt');
		await new Workbench().executeCommand('File: Compare Active File With...');
		let quickOpen: QuickOpenBox | InputBox;
		if (compareVersions(VSBrowser.instance.version, '1.44.0') >= 0) {
			quickOpen = await InputBox.create();
		} else {
			quickOpen = await QuickOpenBox.create();
		}
		await quickOpen.setText('test-file-a.txt');
		await quickOpen.confirm();

		editor = new DiffEditor();
	});

	after(async () => {
		await new Workbench().executeCommand('View: Close Editor');
		await new Promise((res) => {
			setTimeout(res, 500);
		});
		await new EditorView().closeAllEditors();
	});

	it('can get original and modified editors', async function () {
		const originalEditor = await editor.getOriginalEditor();
		const modifiedEditor = await editor.getModifiedEditor();

		expect(await originalEditor.getText()).equals('b');
		expect(await modifiedEditor.getText()).equals('a');
	});
});
