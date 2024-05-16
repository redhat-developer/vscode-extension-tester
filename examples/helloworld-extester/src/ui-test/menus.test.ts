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
import { ActivityBar, ContextMenu, EditorView, TitleBar } from 'vscode-extension-tester';

// there are 2 types of menus in vscode: title bar and context menus
// a lot of page objects can open context menus using the 'openContextMenu' method
// the title bar items also open context menus, all context menus were created equal
// neither menu will work on mac, since they are native there
(process.platform === 'darwin' ? describe.skip : describe)('Example menu manipulation test', () => {
	let titleBar: TitleBar;

	before(() => {
		titleBar = new TitleBar();
	});

	after(async () => {
		// we will be opening editors during the tests, close them afterwards
		await new EditorView().closeAllEditors();
	});

	describe('Title Bar', () => {
		// the most useful method of titlebar is 'select'
		// which selects an entire path of (possibly) nested menu items
		it('Select a top level item', async () => {
			// selecting a top level item opens a context menu
			// select then returns a ContextMenu page object
			const menu = await titleBar.select('File');

			expect(menu).not.undefined;
			// lets just close the context menu for now
			await (menu as ContextMenu).close();
		});

		// Selecting an item with no submenu just clicks it
		it('Select a leaf item', async () => {
			// Open settings using File > Preferences > Settings from the title bar
			await titleBar.select('File', 'Preferences', 'Settings');

			// now we can use EditorView to look at the open editors
			// and assert that Settings did indeed open
			const titles = await new EditorView().getOpenEditorTitles();
			expect(titles).contains('Settings');
		});

		// Apart from selection, all menus have methods for retrieving items
		it('Menu items', async () => {
			// get items gives you all the menu items as MenuItem objects
			const items = await titleBar.getItems();
			// if you want labels/titles instead, you need to use the getLabel method
			const titles = await Promise.all(items.map(async (item) => await item.getLabel()));
			expect(titles).contains('File');

			// analogically, for a single item
			const item = await titleBar.getItem('File');
			expect(item).not.undefined;

			// if an item with given label does not exist, undefined is returned
			const nonExistent = await titleBar.getItem('this doesnt exist');
			expect(nonExistent).undefined;

			// to check if a menu item with given label exists
			expect(await titleBar.hasItem('File')).is.true;
		});
	});

	describe('Elements with context menu', async () => {
		it('open context menu on an element', async () => {
			// lets take an element that has a context menu and open it
			// all page objects that support context menus will have the 'openContextMenu' method
			const menu = await new ActivityBar().openContextMenu();

			// click on one of the items
			await menu.select('Extensions');
		});
	});
});
