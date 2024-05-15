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
import { BottomBarPanel, OutputView, TerminalView, VSBrowser, Workbench } from 'vscode-extension-tester';

describe('Output View/Text Views', function () {
	let panel: BottomBarPanel;
	let view: OutputView;
	const channelName = VSBrowser.instance.version > '1.72.2' && VSBrowser.instance.version < '1.74.0' ? 'Log (Git)' : 'Git';

	before(async function () {
		this.timeout(25000);
		await VSBrowser.instance.openResources(path.resolve(__dirname, '..', '..', '..', 'resources'));
		await VSBrowser.instance.waitForWorkbench();
	});

	before(async function () {
		this.timeout(15000);
		const center = await new Workbench().openNotificationsCenter();
		await center.clearAllNotifications();
		await center.close();
		panel = new BottomBarPanel();
		await panel.toggle(true);
		await panel.maximize();
		view = await panel.openOutputView();
		await new Promise((resolve) => setTimeout(resolve, 2000));
	});

	after(async function () {
		await panel.restore();
		await new Promise((resolve) => setTimeout(resolve, 500));
		await panel.toggle(false);
	});

	it('getChannelNames returns list of channels', async function () {
		const channels = await view.getChannelNames();
		expect(channels).not.empty;
	});

	it('getCurrentChannel returns the selected channel name', async function () {
		if (process.platform !== 'darwin' && VSBrowser.instance.version >= '1.87.0') {
			this.skip();
		}
		const channel = await view.getCurrentChannel();
		expect(channel).not.empty;
	});

	it('selectChannel works', async function () {
		this.timeout(10000);
		if (process.platform !== 'darwin' && VSBrowser.instance.version >= '1.87.0') {
			this.skip();
		}
		await view.selectChannel('Tasks');
		const final = await view.getCurrentChannel();
		expect('Tasks').equals(final);
	});

	it('getText returns all current text', async function () {
		await view.selectChannel(channelName);
		await new Promise((resolve) => setTimeout(resolve, 2000));
		const text = await view.getText();
		expect(text).not.empty;
	});

	it('clearText clears the text view', async function () {
		await view.selectChannel(channelName);
		const text = await view.getText();
		await view.clearText();
		const cleared = await view.getText();
		expect(cleared).not.has.string(text);
	});

	describe('Terminal View', function () {
		let terminal: TerminalView;
		let terminalName = process.platform === 'win32' ? (VSBrowser.instance.version >= '1.53.0' ? 'pwsh' : 'powershell') : 'bash';

		before(async () => {
			terminal = await panel.openTerminalView();
			await new Promise((res) => setTimeout(res, 2000));
		});

		it('getText returns all current text', async function () {
			try {
				await terminal.selectChannel(`1: ${terminalName}`);
			} catch (err) {
				terminalName = 'sh';
				await terminal.selectChannel(`1: ${terminalName}`);
			}
			const text = await terminal.getText();
			expect(text).not.empty;
		});

		it('executeCommand works', async function () {
			const command = `${process.platform === 'win32' ? 'start-sleep -s' : 'sleep'} 2`;
			await terminal.executeCommand(command, 5000);
			expect(await terminal.getText()).to.have.string('sleep');
		});

		it('newTerminal opens a new term channel', async function () {
			await terminal.newTerminal();
			const channel = await terminal.getCurrentChannel();
			expect(channel).equals(`2: ${terminalName}`);
		});
	});
});
