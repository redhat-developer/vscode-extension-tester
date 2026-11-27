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

import { beforeAll, describe, expect, it } from 'vitest';
import { ActivityBar, VSBrowser } from 'vscode-extension-tester';

describe('ActivityBar (Vitest)', () => {
	let bar: ActivityBar;

	beforeAll(() => {
		bar = new ActivityBar();
	});

	it('runs against the VS Code window started by ExTester', () => {
		expect(VSBrowser.instance.isAttached).toBe(true);
	});

	it('getViewControls finds view containers', async () => {
		const controls = await bar.getViewControls();
		expect(controls.length).toBeGreaterThan(0);
	});

	it.each(['Explorer', 'Search', 'Extensions'])('getViewControl finds %s', async (label) => {
		expect(await bar.getViewControl(label)).toBeDefined();
	});

	it('getViewControl returns undefined with an invalid label', async () => {
		expect(await bar.getViewControl('whatever')).toBeUndefined();
	});

	it('getGlobalAction finds the Manage action', async () => {
		expect(await bar.getGlobalAction('Manage')).toBeDefined();
	});
});
