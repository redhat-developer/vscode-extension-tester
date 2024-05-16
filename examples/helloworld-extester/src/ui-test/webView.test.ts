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

import { Workbench, EditorView, WebView, By } from 'vscode-extension-tester';
import { expect } from 'chai';

// An example how to handle a simple web view
describe('Sample WebView Test', () => {
	let view: WebView;

	before(async function () {
		this.timeout(8000);
		// open a sample web view
		await new Workbench().executeCommand('Webview Test');
		await new Promise((res) => {
			setTimeout(res, 500);
		});
		// init the WebView page object
		view = new WebView();
		// switch webdriver into the webview iframe, now all webdriver commands are
		// relative to the webview document's root
		// make sure not to try accessing elements outside the web view while switched inside and vice versa
		await view.switchToFrame();
	});

	after(async () => {
		// after we are done with the webview, switch webdriver back to the vscode window
		await view.switchBack();
		await new EditorView().closeAllEditors();
	});

	it('Look for a web element', async () => {
		// now we can use findWebElement to look for elements inside the webview
		const element = await view.findWebElement(By.css('h1'));
		expect(await element.getText()).has.string('This is a web view');
	});

	it('Look for all elements with given locator', async () => {
		// analogically, findWebElements to search for all occurences
		const elements = await view.findWebElements(By.css('h1'));
		expect(elements.length).equals(1);
	});
});
