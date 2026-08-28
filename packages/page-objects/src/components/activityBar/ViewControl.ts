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
	/**
	 * Title of this control, cached on the first successful getTitle() call so the
	 * control can be re-located in the activity bar after its element goes stale.
	 */
	private cachedTitle: string | undefined;

	constructor(element: WebElement, bar: ActivityBar) {
		super(element, bar);
	}

	/**
	 * Opens the associated view if not already open
	 * @returns Promise resolving to SideBarView object representing the opened view
	 */
	async openView(): Promise<SideBarView> {
		// Use safeGetKlass so a stale reference is transparently re-fetched.
		const klass = await this.safeGetKlass();
		if (klass.indexOf(ViewControl.locators.ViewControl.klass) < 0) {
			await this.safeClick();
			// Wait for view to be marked as active
			await this.getWaitHelper().forCondition(
				async () => {
					try {
						const newKlass = await this.safeGetKlass();
						return newKlass.includes(ViewControl.locators.ViewControl.klass);
					} catch {
						return false;
					}
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
		const klass = await this.safeGetKlass();
		if (klass.indexOf(ViewControl.locators.ViewControl.klass) > -1) {
			await this.safeClick();
		}
	}

	/**
	 * Returns the title of the associated view
	 */
	async getTitle(): Promise<string> {
		const badge = await this.findElement(ViewControl.locators.ViewControl.badge);
		const title = (await badge.getAttribute('aria-label'))!;
		this.cachedTitle = title;
		return title;
	}

	/**
	 * Re-locate this control in the activity bar by its cached title.
	 * Used by withRecovery()-based helpers (safeClick, safeGetKlass) when the
	 * stored element reference goes stale, e.g. after the activity bar re-renders.
	 */
	protected override async reinitialize(): Promise<this> {
		if (!this.cachedTitle) {
			throw new Error(`ViewControl: element is stale and no cached title is available to re-locate it`);
		}
		// getViewControls() always queries live elements, so the new reference is fresh.
		const fresh = await new ActivityBar().getViewControl(this.cachedTitle);
		if (!fresh) {
			throw new Error(`ViewControl: could not re-locate stale element '${this.cachedTitle}' in the activity bar`);
		}
		return fresh as this;
	}

	/**
	 * Read the CSS class attribute from this element, recovering transparently if
	 * the stored reference has become stale.
	 */
	private async safeGetKlass(): Promise<string> {
		return await this.withRecovery(async (self) => {
			return (await self.getAttribute(ViewControl.locators.ViewControl.attribute))!;
		});
	}
}
