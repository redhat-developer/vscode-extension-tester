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

import { ActivityBar, DefaultTreeSection, EditorView, SideBarView, ViewContent, ViewTitlePart, VSBrowser } from 'vscode-extension-tester';
import * as path from 'path';
import { expect } from 'chai';

// in this test we will look at tree views in the left side bar
describe('Example tree view tests', () => {
	let titlePart: ViewTitlePart;
	let content: ViewContent;

	before(async () => {
		// we will be looking at the explorer view
		// first we need to open a folder to get some items into the view
		await VSBrowser.instance.openResources(path.join('src', 'ui-test', 'resources', 'test'));
		// make sure the view is open
		(await new ActivityBar().getViewControl('Explorer'))?.openView();

		// now to initialize the view
		// this object is basically just a container for two parts: title & content
		const view = new SideBarView();
		titlePart = view.getTitlePart();
		content = view.getContent();
	});

	it('Title part', async () => {
		// title part usually only contains the title of the view
		// but it can also have action buttons
		const title = await titlePart.getTitle();
		expect(title.toLowerCase()).equals('explorer');

		// explorer doesn't really have action buttons, but you can search for them anyway
		const actions = await titlePart.getActions();
	});

	describe('Content', () => {
		// the content part is split into an arbitrary number of sections
		// each section may have a different layout
		// tree sections not contributed by extensions are covered by 'DefaultTreeSection' page object
		// tree sections contributed by extensions are slightly different and covered by 'CustomTreeSection'
		let tree: DefaultTreeSection;

		before(async () => {
			// in this case we are searching for a section that houses the folder we opened earlier
			// that one is usually named the same as the folder
			// this is a section provided by vscode, so we are using DefaultTreeSection page object
			tree = (await content.getSection('test')) as DefaultTreeSection;

			// if your view only has one section and you cant see the title, then
			// (await content.getSections())[0]
			// is the easiest way to access it
		});

		it('Look at the items', async () => {
			// get all the items visible in the view
			const items = await tree.getVisibleItems();

			// by default we should only see the contents of the root folder
			const labels = await Promise.all(items.map((item) => item.getLabel()));
			expect(labels).contains('test-folder');
			expect(labels).contains('test-file');

			// we can also open folders
			// using 'openItem' method on a folder will return its children
			const children = await tree.openItem('test-folder');
			// test-folder has one file in it
			expect(children.length).equals(1);

			// or we can open files the same way
			// note that files have no children, so an empty array is returned
			// make sure to put in the whole path to the item if it is not directly in the root folder
			const notReallyChildren = await tree.openItem('test-folder', 'more-test-file');
			expect(notReallyChildren).is.empty;

			// opening a file will open it in an editor
			const editors = await new EditorView().getOpenEditorTitles();
			expect(editors).contains('more-test-file');
		});

		it('A little bit of searching', async () => {
			// note how the previous methods only worked with items that are currently displayed
			// in order to find an item that needs to be scrolled to, we can use findItem
			// this method will not search collapsed folders, but it will scroll through the whole tree
			const item = await tree.findItem('more-test-file');
			expect(item).not.undefined;

			// it can also be limited to only work within a certain depth
			const item1 = await tree.findItem('more-test-files', 1);
			// the item exists, but we limited the search to only look at depth 1, direct descendants of the root folder
			// therefore item1 should be undefined (not found)
			expect(item1).undefined;
		});
	});
});
