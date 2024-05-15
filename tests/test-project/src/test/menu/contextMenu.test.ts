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

import { TitleBar, ContextMenu, before, beforeEach, VSBrowser } from 'vscode-extension-tester';
import { expect } from 'chai';
import * as path from 'path';

(process.platform === 'darwin' ? describe.skip : describe)('ContextMenu', function () {
	let bar: TitleBar;
	let menu: ContextMenu;

	before(async () => {
		this.timeout(30000);
		await VSBrowser.instance.openResources(path.resolve(__dirname, '..', '..', '..', 'resources', 'test-folder'));
		await VSBrowser.instance.driver.sleep(5000);
	});

	beforeEach(async function () {
		bar = new TitleBar();
		menu = (await bar.select('File')) as ContextMenu;
	});

	it('getItems finds all menu items', async function () {
		this.timeout(5000);
		const items = await menu.getItems();
		await menu.close();
		expect(items).not.empty;
	});

	it('getItem finds an item with the given name', async function () {
		this.timeout(5000);
		const item = await menu.getItem('New File...');
		await menu.close();
		expect(item).not.undefined;
	});
});
