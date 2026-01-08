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
import { satisfies } from 'compare-versions';
import { getWaitHelper, waitFor } from '../testUtils';

describe('Output View/Text Views', function () {
	let panel: BottomBarPanel;
	let view: OutputView;
	const channelName = satisfies(VSBrowser.instance.version, '>1.72.2 <1.74.0') ? 'Log (Git)' : 'Git';

	before(async function () {
		this.timeout(25000);
		const wait = getWaitHelper();
		await VSBrowser.instance.openResources(path.resolve(__dirname, '..', '..', '..', 'resources'), async () => {
			await wait.sleep(3_000);
		});
		await VSBrowser.instance.waitForWorkbench();
	});

	before(async function () {
		this.timeout(15000);
		const wait = getWaitHelper();
		const center = await new Workbench().openNotificationsCenter();
		await center.clearAllNotifications();
		await center.close();
		panel = new BottomBarPanel();
		await panel.toggle(true);
		await panel.maximize();
		view = await panel.openOutputView();
		// Wait for output view to stabilize
		await wait.forStable(view, { timeout: 3000 });
	});

	after(async function () {
		const wait = getWaitHelper();
		await panel.restore();
		await wait.forStable(panel, { timeout: 1000 });
		await panel.toggle(false);
	});

	it('getChannelNames returns list of channels', async function () {
		const channels = await view.getChannelNames();
		expect(channels).not.empty;
	});

	it('getCurrentChannel returns the selected channel name', async function () {
		if (process.platform !== 'darwin' && satisfies(VSBrowser.instance.version, '>=1.87.0')) {
			this.skip();
		}
		const channel = await view.getCurrentChannel();
		expect(channel).not.empty;
	});

	it('selectChannel works', async function () {
		this.timeout(10000);
		if (process.platform !== 'darwin' && satisfies(VSBrowser.instance.version, '>=1.87.0')) {
			this.skip();
		}
		await view.selectChannel('Tasks');
		const final = await view.getCurrentChannel();
		expect('Tasks').equals(final);
	});

	it('getText returns all current text', async function () {
		await view.selectChannel(channelName);
		// Wait for channel content to load
		await waitFor(
			async () => {
				const text = await view.getText();
				return text.length > 0;
			},
			{ timeout: 3000, message: 'Channel text did not appear' },
		);
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
		let terminalName = process.platform === 'win32' ? (satisfies(VSBrowser.instance.version, '>=1.53.0') ? 'pwsh' : 'powershell') : 'bash';

		before(async function () {
			this.timeout(15_000);
			const wait = getWaitHelper();
			terminal = await panel.openTerminalView();
			// Wait for terminal to stabilize
			await wait.forStable(terminal, { timeout: 3000 });
		});

		it('getText returns all current text', async function () {
			try {
				await terminal.selectChannel(`1: ${terminalName}`);
			} catch (err) {
				try {
					terminalName = 'sh';
					await terminal.selectChannel(`1: ${terminalName}`);
				} catch (error) {
					terminalName = 'zsh';
					await terminal.selectChannel(`1: ${terminalName}`);
				}
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
			const expectedChannel = [`2: ${terminalName}`, `2: zsh`];
			await terminal.newTerminal();
			await waitFor(
				async () => {
					try {
						return expectedChannel.includes(await terminal.getCurrentChannel());
					} catch (err) {
						return false;
					}
				},
				{ timeout: 10000, pollInterval: 1000, message: 'New terminal channel did not appear' },
			);
			expect(expectedChannel).contains(await terminal.getCurrentChannel());
		});
	});
});
