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
import { EditorView, Workbench } from 'vscode-extension-tester';

describe('Workbench', () => {
	let bench: Workbench;

	before(() => {
		bench = new Workbench();
	});

	it('getTitleBar returns title bar reference', () => {
		const bar = bench.getTitleBar();
		expect(bar).not.undefined;
	});

	it('getSideBar returns side bar reference', () => {
		const bar = bench.getSideBar();
		expect(bar).not.undefined;
	});

	it('getActivityBar returns activity bar reference', () => {
		const bar = bench.getActivityBar();
		expect(bar).not.undefined;
	});

	it('getStatusBar returns status bar reference', () => {
		const bar = bench.getStatusBar();
		expect(bar).not.undefined;
	});

	it('getBottomBar returns bottom bar reference', () => {
		const bar = bench.getBottomBar();
		expect(bar).not.undefined;
	});

	it('getEditorView returns editor view reference', () => {
		const view = bench.getEditorView();
		expect(view).not.undefined;
	});

	it('openNotificationsCenter works', async () => {
		const center = await bench.openNotificationsCenter();
		await center.getDriver().wait(
			async () => {
				return await center.isDisplayed();
			},
			5000,
			'Notifications center was not displayed properly!',
		);
		await center.close();
	});

	it('openCommandPrompt works', async () => {
		const prompt = await bench.openCommandPrompt();
		expect(await prompt.isDisplayed()).is.true;
		await prompt.cancel();
	});

	it('executeCommand works', async () => {
		await bench.executeCommand('Hello World');
		await bench.getDriver().sleep(500);
		const notifications = await bench.getNotifications();
		expect(notifications).not.empty;

		const message = await notifications[0].getMessage();
		expect(message).is.equal('Hello World!');
	});

	it('openSettings opens the settings editor', async function () {
		this.timeout(8000);
		const editor = await bench.openSettings();
		expect(await editor.getTitle()).equals('Settings');
		await new EditorView().closeAllEditors();
	});
});
