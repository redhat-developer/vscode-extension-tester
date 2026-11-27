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

// Fixture for the Vitest adapter unit test: runs in a Vitest worker against a fake WebDriver server.
import { describe, expect, it } from 'vitest';
import { VSBrowser } from 'vscode-extension-tester';

describe('Attached suite', () => {
	it('drives the session of the ExTester process', async () => {
		expect(VSBrowser.instance.isAttached).toBe(true);
		expect(await VSBrowser.instance.driver.getTitle()).toBe('Fake VS Code');
	});

	it('fails on purpose', () => {
		expect(1).toBe(2);
	});
});
