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
import { CustomStatusBar } from '../customPageObjects/CustomStatusBar';

/**
 * Integration test for custom page object support.
 *
 * Verifies that:
 *   1. A locator contribution file is correctly loaded via RunOptions.customPageObjects
 *   2. A page object class extending AbstractElement can resolve its custom locators
 *   3. The element is found and interactive in the live VS Code instance
 *
 * The test project's ui-test:custom-po script passes --custom_page_objects pointing
 * at out/test/customPageObjects/locators.js when running this test file.
 */
describe('Custom Page Objects', () => {
	it('custom page object class resolves its locator and finds the element', async () => {
		const statusBar = new CustomStatusBar();
		expect(await statusBar.isDisplayed()).to.be.true;
	});
});
