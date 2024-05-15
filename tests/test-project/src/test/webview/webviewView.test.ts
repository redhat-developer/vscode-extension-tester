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
import { BottomBarPanel, By, CustomTreeSection, SideBarView, WebviewView, Workbench } from 'vscode-extension-tester';

describe('WebviewViews', function () {
	const params = [
		{
			title: 'BottomBar',
			command: 'My Panel: Focus on My Panel View View',
			closePanel: true,
			closeSection: false,
		},
		{
			title: 'SideBar',
			command: 'Explorer: Focus on My Side Panel View View',
			closePanel: false,
			closeSection: true,
		},
	];

	params.forEach(function (param) {
		describe(`${param.title} WebviewViews`, function () {
			let webviewView: InstanceType<typeof WebviewView>;

			before(async function () {
				await new Workbench().executeCommand(param.command);
				webviewView = new WebviewView();
				await webviewView.switchToFrame(1000);
			});

			after(async function () {
				if (webviewView) {
					await webviewView.switchBack();
				}
				if (param.closePanel) {
					await new BottomBarPanel().toggle(false);
				}
				if (param.closeSection) {
					const section = (await new SideBarView().getContent().getSection('My Side Panel View')) as CustomTreeSection;
					await section.collapse();
				}
			});

			it('findWebElement works', async function () {
				const element = await webviewView.findWebElement(By.css('h1'));
				expect(await element.getText()).has.string('Shopping List');
			});

			it('findWebElements works', async function () {
				const elements = await webviewView.findWebElements(By.css('li'));
				expect(elements.length).equals(2);
			});

			it('contains Apple and Banana', async function () {
				const elts = await webviewView.findWebElements(By.xpath('//div/ul/li'));
				const listContent: string[] = [];
				await Promise.all(
					elts.map(async (elt) => {
						listContent.push(await elt.getText());
					}),
				);
				expect(listContent).to.have.length(2);
				expect(listContent).to.contain('Apple');
				expect(listContent).to.contain('Banana');
			});
		});
	});
});
