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
import path from 'path';
import { BottomBarPanel, WebElement, Workbench, ViewControl, ActivityBar, WebviewView, By, VSBrowser } from 'vscode-extension-tester';

describe('BottomBarPanel', function () {
	let panel: BottomBarPanel;

	before(async function () {
		this.timeout(30_000);
		const browser = VSBrowser.instance;
		await browser.openResources(path.resolve(__dirname, '..', '..', '..', 'resources', 'debug-project'), async () => {
			await browser.driver.sleep(3_000);
		});

		panel = new BottomBarPanel();

		// Clear notifications and close the center afterwards
		const notifCenter = await new Workbench().openNotificationsCenter();
		await notifCenter.clearAllNotifications();
		try {
			await notifCenter.close();
		} catch {
			// center may have already closed itself
		}

		// Close Explorer sidebar; wait for the animation to finish
		const explorerControl = (await new ActivityBar().getViewControl('Explorer')) as ViewControl;
		await explorerControl.closeView();
		await browser.driver.wait(async () => {
			try {
				return !(await explorerControl.isSelected());
			} catch {
				return true; // control is gone / already closed
			}
		}, 5_000);
	});

	after(async function () {
		await panel.toggle(false);
	});

	it('can be toggled open', async function () {
		this.timeout(10_000);
		await panel.toggle(true);
		expect(await panel.isDisplayed()).is.true;
	});

	it('can be toggled closed', async function () {
		this.timeout(10_000);
		await panel.toggle(true);
		await panel.toggle(false);
		expect(await panel.isDisplayed()).is.false;
	});

	it('can be maximized and restored', async function () {
		this.timeout(20_000);
		await panel.toggle(true);
		const initHeight = await getHeight(panel);

		await panel.maximize();
		const maxHeight = await getHeight(panel);
		expect(maxHeight).greaterThan(initHeight);
		await panel.getDriver().sleep(1_000);

		await panel.restore();
		const restoredHeight = await getHeight(panel);
		expect(initHeight).equals(restoredHeight);
	});

	it('can open problems view', async function () {
		this.timeout(10_000);
		const view = await panel.openProblemsView();
		expect(await view.isDisplayed()).is.true;
	});

	it('can open output view', async function () {
		this.timeout(10_000);
		const view = await panel.openOutputView();
		expect(await view.isDisplayed()).is.true;
	});

	it('can open debug console view', async function () {
		this.timeout(10_000);
		const view = await panel.openDebugConsoleView();
		expect(await view.isDisplayed()).is.true;
	});

	it('can open terminal view', async function () {
		this.timeout(10_000);
		const view = await panel.openTerminalView();
		expect(await view.isDisplayed()).is.true;
	});

	it('can switch tabs using openTab', async function () {
		this.timeout(15_000);
		panel = new BottomBarPanel();
		await panel.openTab('My Panel');
		const webviewView = new WebviewView();
		await webviewView.switchToFrame(5000);
		const element = await webviewView.findWebElement(By.css('h1'));
		expect(await element.getText()).has.string('Shopping List');
		await webviewView.switchBack();
	});
});

async function getHeight(element: WebElement): Promise<number> {
	const size = await element.getRect();
	return size.height;
}
