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

import { describe, expect, it } from 'vitest';
import { Workbench } from 'vscode-extension-tester';

describe('Workbench (Vitest)', () => {
	const bench = new Workbench();

	it('returns references to the main parts', () => {
		expect(bench.getTitleBar()).toBeDefined();
		expect(bench.getSideBar()).toBeDefined();
		expect(bench.getActivityBar()).toBeDefined();
		expect(bench.getStatusBar()).toBeDefined();
		expect(bench.getEditorView()).toBeDefined();
	});

	it('openCommandPrompt works', async () => {
		const prompt = await bench.openCommandPrompt();
		expect(await prompt.isDisplayed()).toBe(true);
		await prompt.cancel();
	});

	it('shows a notification from the test extension', async () => {
		await bench.executeCommand('Hello World');
		const center = await bench.openNotificationsCenter();
		const notification = await center.waitForNotification('Hello World', 30_000);
		expect(await notification.getMessage()).toContain('Hello World');
		await center.clearAllNotifications();
	});
});
