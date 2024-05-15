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
import { ActivityBar, ActionsControl } from 'vscode-extension-tester';

(process.platform === 'darwin' ? describe.skip : describe)('ActionsControl', () => {
	let bar: ActivityBar;
	let control: ActionsControl | undefined;

	before(async function () {
		bar = new ActivityBar();
		control = await bar.getGlobalAction('Manage');
	});

	it('openActionsMenu displays context menu', async () => {
		const menu = await control?.openActionMenu();
		expect(await menu?.isDisplayed()).is.true;
		await menu?.close();
	});

	it('getTitle returns the action container label', async () => {
		const title = await control?.getTitle();
		expect(title).equals('Manage');
	});
});
