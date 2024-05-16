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
import { InputBox, Workbench } from 'vscode-extension-tester';

// Example tests on handling input boxes
describe('Sample Inputs tests', () => {
	let input: InputBox;

	before(async () => {
		// we need an input box to open
		// extensions usually open inputs as part of their commands
		// the built-in input box we can use is the command prompt/palette
		await new Workbench().openCommandPrompt();

		// openCommandPrompt returns an InputBox, but if you need to wait for an arbitrary input to appear
		// note this does not open the input, it simply waits for it to open and constructs the page object
		input = await InputBox.create();
	});

	it('Text manipulation', async () => {
		// set some text in the input
		await input.setText('hello');

		// get the current text
		const text = await input.getText();
		expect(text).equals('hello');

		// clear the text
		await input.clear();
	});

	it('Quick picks', async () => {
		await input.setText('> hello world');

		// get all the visible quick picks
		// note that quick picks outside the scroll window are ignored
		const picks = await input.getQuickPicks();
		expect(picks).not.empty;

		// if you want to find a quick pick that might not be currently shown, use
		const pick = await input.findQuickPick('Hello World');

		// or if you want to find and select a quick pick
		// await input.selectQuickPick('Hello World');

		// if checkboxes are available for your quick picks, you can also check/uncheck them all in one call
		// await input.toggleAllQuickPicks(true/false);
	});

	// it('Other properties', async () => {
	//     // input boxes can have multiple other properties, all of these are self explanatory

	//     await input.getMessage();
	//     await input.getPlaceHolder();
	//     await input.hasError();
	//     await input.hasProgress();
	// });

	it('Flow actions', async () => {
		// there are a few actions to perform with an input box
		// to confirm
		// await input.confirm();

		// if you are using a workflow, there can also be a back button
		// await input.back()

		// or you can simply cancel (close) the input
		await input.cancel();
	});
});
