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
import { BottomBarPanel, WebElement, Workbench, ViewControl, ActivityBar } from 'vscode-extension-tester';

describe('BottomBarPanel', function () {
	let panel: BottomBarPanel;

	before(async function () {
		panel = new BottomBarPanel();
		await (await new Workbench().openNotificationsCenter()).clearAllNotifications();
		await ((await new ActivityBar().getViewControl('Explorer')) as ViewControl).openView();
	});

	after(async function () {
		await panel.toggle(false);
	});

	it('can be toggled open', async function () {
		await panel.toggle(true);
		expect(await panel.isDisplayed()).is.true;
	});

	it('can be toggled closed', async function () {
		await panel.toggle(true);
		await panel.toggle(false);
		expect(await panel.isDisplayed()).is.false;
	});

	it('can be maximized and restored', async function () {
		this.timeout(20000);
		await panel.toggle(true);
		const initHeight = await getHeight(panel);

		await panel.maximize();
		const maxHeight = await getHeight(panel);
		expect(maxHeight).greaterThan(initHeight);
		await new Promise((res) => setTimeout(res, 1000));

		await panel.restore();
		const restoredHeight = await getHeight(panel);
		expect(initHeight).equals(restoredHeight);
	});

	it('can open problems view', async function () {
		const view = await panel.openProblemsView();
		expect(await view.isDisplayed()).is.true;
	});

	it('can open output view', async function () {
		const view = await panel.openOutputView();
		expect(await view.isDisplayed()).is.true;
	});

	it('can open debug console view', async function () {
		const view = await panel.openDebugConsoleView();
		expect(await view.isDisplayed()).is.true;
	});

	it('can open terminal view', async function () {
		const view = await panel.openTerminalView();
		expect(await view.isDisplayed()).is.true;
	});
});

async function getHeight(element: WebElement): Promise<number> {
	const size = await element.getRect();
	return size.height;
}
