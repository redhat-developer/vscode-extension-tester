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
import { satisfies } from 'compare-versions';
import { ActivityBar, ViewControl, VSBrowser } from 'vscode-extension-tester';

describe('ViewControl', () => {
	let bar: ActivityBar;
	let control: ViewControl | undefined;

	before(async () => {
		bar = new ActivityBar();
		control = await bar.getViewControl('Explorer');
	});

	it('openView opens the underlying view', async () => {
		const view = await control?.openView();
		const klass = await control?.getAttribute('class');

		expect(klass?.indexOf('checked')).greaterThan(-1);
		expect(await view?.isDisplayed()).is.true;

		const title = await view?.getTitlePart().getTitle();
		expect(title?.toLowerCase()).equals('explorer');
	});

	it('closeView closes the side bar view', async () => {
		await control?.openView();
		await control?.closeView();

		const klass = await control?.getAttribute('class');
		expect(klass?.indexOf('checked')).lessThan(0);
	});

	it('getTitle returns container label', async () => {
		const title = await control?.getTitle();
		expect(title).has.string('Explorer');
	});

	(process.platform === 'darwin' && satisfies(VSBrowser.instance.version, '<1.101.0') ? it.skip : it)('openContextMenu shows context menu', async () => {
		const menu = await control?.openContextMenu();
		expect(await menu?.isDisplayed()).is.true;
		await menu?.close();
	});
});
