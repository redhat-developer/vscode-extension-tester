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

import { ActivityBar, DebugView, SideBarView, ScmView } from '../..';
import { ElementWithContextMenu } from '../ElementWithContextMenu';
import { WebElement } from 'selenium-webdriver';
import { NewScmView } from '../sidebar/scm/NewScmView';
import { satisfies } from 'compare-versions';

/**
 * Page object representing a view container item in the activity bar
 */
export class ViewControl extends ElementWithContextMenu {
	constructor(element: WebElement, bar: ActivityBar) {
		super(element, bar);
	}

	/**
	 * Opens the associated view if not already open
	 * @returns Promise resolving to SideBarView object representing the opened view
	 */
	async openView(): Promise<SideBarView> {
		// Check whether view is already open
		const klass = await this.getAttribute(ViewControl.locators.ViewControl.attribute);
		if (klass.indexOf(ViewControl.locators.ViewControl.klass) < 0) {
			await this.click();
			// Wait for view to be marked as active
			await this.getWaitHelper().forCondition(
				async () => {
					const newKlass = await this.getAttribute(ViewControl.locators.ViewControl.attribute);
					return newKlass.includes(ViewControl.locators.ViewControl.klass);
				},
				{ timeout: 2000, pollInterval: 100 },
			);
		}
		const view = await new SideBarView().wait();
		if ((await view.findElements(ViewControl.locators.ViewControl.scmId)).length > 0) {
			if (ViewControl.versionInfo.browser === 'vscode' && satisfies(ViewControl.versionInfo.version, '>=1.47.0')) {
				return new NewScmView().wait();
			}
			return new ScmView().wait();
		}
		if ((await view.findElements(ViewControl.locators.ViewControl.debugId)).length > 0) {
			return new DebugView().wait();
		}
		return view;
	}

	/**
	 * Closes the associated view if not already closed
	 * @returns Promise resolving when the view closes
	 */
	async closeView(): Promise<void> {
		const klass = await this.getAttribute(ViewControl.locators.ViewControl.attribute);
		if (klass.indexOf(ViewControl.locators.ViewControl.klass) > -1) {
			await this.click();
		}
	}

	/**
	 * Returns the title of the associated view
	 */
	async getTitle(): Promise<string> {
		const badge = await this.findElement(ViewControl.locators.ViewControl.badge);
		return await badge.getAttribute('aria-label');
	}
}
