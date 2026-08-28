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

import { EditorView, VSBrowser, Workbench, InputBox } from 'vscode-extension-tester';
import * as path from 'path';
import { waitFor } from '../testUtils';

describe('Simple open file dialog', function () {
	const filePath = path.resolve('.', 'package.json');

	after(async function () {
		await new EditorView().closeAllEditors();
	});

	it('Opens a file', async function () {
		this.timeout(60000);
		const input = await new Workbench().openCommandPrompt();
		await input.setText('>File: Open File...');
		await waitFor(
			async () => {
				const pick = await input.findQuickPick('File: Open File...');
				return pick !== undefined;
			},
			{ timeout: 8000, message: 'Could not find quick pick "File: Open File..."' },
		);
		await input.selectQuickPick('File: Open File...');

		// Give VS Code time to switch from command mode to the file-open dialog —
		// InputBox.create uses a fixed 5 s default which is too tight on slow CI runners.
		const prompt = await InputBox.create(15000);
		await waitFor(
			async () => {
				const text = await prompt.getText();
				return !text.startsWith('>');
			},
			{ timeout: 8000, message: 'Input box did not transition from command prompt to file dialog' },
		);

		await prompt.setText(filePath);
		await prompt.getDriver().sleep(500);
		await prompt.confirmPath();

		await VSBrowser.instance.driver.wait(
			async () => {
				try {
					const openEditorTitles = await new EditorView().getOpenEditorTitles();
					return openEditorTitles.includes('package.json');
				} catch {
					return false;
				}
			},
			20000,
			`No editor with title 'package.json' available.`,
		);
	});
});
