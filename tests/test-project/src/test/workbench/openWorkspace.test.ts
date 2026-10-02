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
import { VSBrowser } from 'vscode-extension-tester';

// Issue #2558: a .code-workspace file is opened as a workspace (window reload),
// never as an editor tab, so openResources must not wait for it to show up in
// the editor and must not fall back to opening it via quick open.
describe('Open workspace file via openResources', function () {
	const resources = path.resolve(__dirname, '..', '..', '..', 'resources');

	after(async function () {
		this.timeout(60000);
		await VSBrowser.instance.openResources(path.resolve(__dirname, '..', '..', '..'));
	});

	it('opens a .code-workspace file without editor-tab retries', async function () {
		this.timeout(60000);
		const warnings: string[] = [];
		const originalWarn = console.warn;
		console.warn = (...args: unknown[]) => {
			warnings.push(args.join(' '));
			originalWarn(...args);
		};
		try {
			await VSBrowser.instance.openResources(path.join(resources, 'test.code-workspace'));
		} finally {
			console.warn = originalWarn;
		}
		expect(warnings, 'openResources should not retry a workspace file').to.be.empty;

		await VSBrowser.instance.driver.wait(
			async () => (await VSBrowser.instance.driver.getTitle()).includes('test (Workspace)'),
			15000,
			'Window title does not show the opened workspace',
		);
	});
});
