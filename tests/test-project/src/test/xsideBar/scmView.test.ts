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

import { ScmView, ActivityBar, ScmProvider, ScmChange, EditorView, VSBrowser, ViewControl } from 'vscode-extension-tester';
import * as path from 'path';
import { expect } from 'chai';
import * as fs from 'fs-extra';
import { satisfies } from 'compare-versions';

(satisfies(VSBrowser.instance.version, '>=1.38.0') ? describe : describe.skip)('SCM View', () => {
	let view: ScmView;

	before(async function () {
		this.timeout(15000);
		fs.writeFileSync(path.resolve('.', 'testfile'), 'content');
		await VSBrowser.instance.openResources(path.resolve('..', '..'));
		await VSBrowser.instance.waitForWorkbench();
		view = (await ((await new ActivityBar().getViewControl('Source Control')) as ViewControl).openView()) as ScmView;
		await new Promise((res) => {
			setTimeout(res, 2000);
		});
	});

	after(() => {
		fs.unlinkSync(path.resolve('.', 'testfile'));
	});

	it('getProviders works', async () => {
		const providers = await view.getProviders();
		expect(providers).not.empty;
	});

	it('getProvider works', async () => {
		const provider = await view.getProvider('vscode-extension-tester');
		expect(provider).not.undefined;
	});

	describe('ScmProvider', () => {
		let provider: ScmProvider;

		before(async () => {
			provider = (await view.getProvider('vscode-extension-tester')) as ScmProvider;
		});

		it('getTitle works', async () => {
			const title = await provider.getTitle();
			if (satisfies(VSBrowser.instance.version, '>=1.47.0')) {
				expect(title).equals('');
			} else {
				expect(title).equals('vscode-extension-tester');
			}
		});

		it('getType works', async () => {
			const type = await provider.getType();
			if (satisfies(VSBrowser.instance.version, '>=1.47.0')) {
				expect(type).equals('');
			} else {
				expect(type).equals('Git');
			}
		});

		it('getChangeCount works', async () => {
			const unCount = await provider.getChangeCount(false);
			expect(unCount).gt(0);
			const stCount = await provider.getChangeCount(true);
			expect(stCount).gte(0);
		});

		it('takeAction works', async () => {
			const action = await provider.takeAction('Refresh');
			expect(action).to.be.true;
		});

		(process.platform === 'darwin' ? it.skip : it)('openMoreActions works', async () => {
			const menu = await provider.openMoreActions();
			expect(menu).not.undefined;
			await menu.close();
		});

		it('getChanges works', async () => {
			const changes = await provider.getChanges(false);
			expect(changes).not.empty;
		});

		describe('ScmChange', () => {
			let change: ScmChange;

			before(async () => {
				const changes = await provider.getChanges(false);
				const titles = await Promise.all(changes.map(async (item) => item.getLabel()));
				const index = titles.findIndex((item) => item === 'testfile');
				change = changes[index];
			});

			after(async () => {
				await new EditorView().closeAllEditors();
			});

			it('getLabel works', async () => {
				const label = await change.getLabel();
				expect(label).has.string('testfile');
			});

			it('getDescritption works', async () => {
				const desc = await change.getDescription();
				expect(desc).has.string('');
			});

			it('getStatus works', async () => {
				expect(await change.getStatus()).has.string('Untracked');
			});

			it('isExpanded works', async () => {
				expect(await change.isExpanded()).to.be.true;
			});

			it('takeAction works', async () => {
				const act = await change.takeAction('Open File');
				expect(act).to.be.true;

				expect(await new EditorView().getOpenEditorTitles()).contains('testfile');
			});
		});
	});
});
