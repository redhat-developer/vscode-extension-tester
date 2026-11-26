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
import * as path from 'path';
import { By, EditorView, VSBrowser } from 'vscode-extension-tester';
import { waitFor } from '../testUtils';

describe('VSBrowser.reloadWindow', function () {
	const resources = path.resolve(__dirname, '..', '..', '..', 'resources');
	const kept = path.join(resources, 'test-file-a.txt');
	const closed = path.join(resources, 'test-file-b.txt');

	after(async function () {
		await new EditorView().closeAllEditors();
	});

	it('reloads the window and reopens only the files still open', async function () {
		this.timeout(90000);
		const driver = VSBrowser.instance.driver;
		await VSBrowser.instance.openResources(kept, closed);
		await new EditorView().closeEditor(path.basename(closed));
		expect(await driver.getTitle()).to.include('test-project');
		const previous = await driver.findElement(By.css('.monaco-workbench'));

		await VSBrowser.instance.reloadWindow();

		const replaced = await previous.isDisplayed().then(
			() => false,
			() => true,
		);
		expect(replaced, 'the workbench before the reload should be gone').to.be.true;
		await waitFor(async () => (await new EditorView().getOpenEditorTitles()).includes(path.basename(kept)), {
			timeout: 15000,
			message: 'The open file was not open again after the reload',
		});
		expect(await new EditorView().getOpenEditorTitles()).not.to.include(path.basename(closed));
		// the same folder is open again: the window title names it as before
		expect(await driver.getTitle()).to.include('test-project');
	});
});
