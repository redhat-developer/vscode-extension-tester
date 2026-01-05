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

import { EditorView, VSBrowser, Workbench } from 'vscode-extension-tester';
import * as path from 'path';

describe('Simple open file dialog', function () {
	const filePath = path.resolve('.', 'package.json');

	after(async function () {
		await new EditorView().closeAllEditors();
	});

	it('Opens a file', async function () {
		this.timeout(30000);
		const input = await new Workbench().openCommandPrompt();
		await input.setText('>File: Open File...');
		await input.selectQuickPick('File: Open File...');
		await new Promise((res) => setTimeout(res, 1000));
		await input.setText(filePath);
		await new Promise((res) => setTimeout(res, 1000));
		await input.selectQuickPick('package.json');
		await new Promise((res) => setTimeout(res, 1000));

		await VSBrowser.instance.driver.wait(
			async () => {
				try {
					const openEditorTitles = await new EditorView().getOpenEditorTitles();
					return openEditorTitles.includes('package.json');
				} catch {
					return false;
				}
			},
			this.timeout() - 10000,
			`No editor with title 'package.json' available.`,
		);
	});
});
