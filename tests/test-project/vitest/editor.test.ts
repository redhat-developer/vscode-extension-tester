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
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { EditorView, TextEditor, VSBrowser, Workbench } from 'vscode-extension-tester';

// opened through the VS Code CLI from the Vitest worker, like openResources() in a Mocha run
const TEST_FILE = path.resolve(__dirname, '..', 'resources', 'test-file-a.txt');

describe('TextEditor (Vitest)', () => {
	let editor: TextEditor;

	beforeAll(async () => {
		await new EditorView().closeAllEditors();
		await VSBrowser.instance.openResources(TEST_FILE);
		editor = (await new EditorView().openEditor('test-file-a.txt')) as TextEditor;
	});

	afterAll(async () => {
		// leave the file as it was, without a "Save changes?" dialog
		await new Workbench().executeCommand('File: Revert File');
		await new EditorView().closeAllEditors();
	});

	it('reads the file name', async () => {
		expect(await editor.getTitle()).toBe('test-file-a.txt');
	});

	it('setText and getText round-trip', async () => {
		await editor.setText('written by a Vitest worker');
		expect(await editor.getText()).toBe('written by a Vitest worker');
		expect(await editor.isDirty()).toBe(true);
	});
});
