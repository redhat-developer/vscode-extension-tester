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

import { satisfies } from 'compare-versions';
import { By, WebElement, until } from 'selenium-webdriver';
import { SideBarView } from '../SideBarView';
import { DebugBreakpointSection } from '../tree/debug/DebugBreakpointSection';
import { DebugCallStackSection } from '../tree/debug/DebugCallStackSection';
import { DebugVariableSection } from '../tree/debug/DebugVariablesSection';
import { WatchSection } from '../tree/debug/WatchSection';

/**
 * Page object representing the Run/Debug view in the side bar
 */
export class DebugView extends SideBarView {
	/**
	 * Get the title of the selected launch configuration
	 * @returns Promise resolving to the title
	 * @deprecated For VS Code 1.88+ this method won't be working any more
	 */
	async getLaunchConfiguration(): Promise<string> {
		if (satisfies(DebugView.versionInfo.version, '>=1.87.0') && process.platform !== 'darwin') {
			throw new Error(
				`DEPRECATED METHOD! The 'DebugView.getLaunchConfiguration' method is broken! Read more information in 'Known Issues > Limitations in testing with VS Code 1.87+' - https://github.com/microsoft/vscode/issues/206897.`,
			);
		}
		const action = await this.getTitlePart().findElement(DebugView.locators.DebugView.launchCombo);
		return await action.getText();
	}

	/**
	 * Get titles of all available launch configurations
	 * @returns Promise resolving to list of titles
	 */
	async getLaunchConfigurations(): Promise<string[]> {
		const contextView = await this.openLaunchDropdown();
		const configs: string[] = [];
		const options = await contextView.findElements(DebugView.locators.DebugView.launchOption);

		for (const option of options) {
			try {
				configs.push((await option.getAttribute(DebugView.locators.DebugView.launchSelectAttribute))!);
			} catch (e: any) {
				if (e.name === 'StaleElementReferenceError') {
					continue;
				}
				throw e;
			}
		}

		await this.closeLaunchDropdown();
		return configs;
	}

	async getVariablesSection(): Promise<DebugVariableSection> {
		const content = this.getContent();
		return content.getSection(DebugVariableSection.locators.DebugVariableSection.predicate, DebugVariableSection);
	}

	/**
	 * Get section which holds information about breakpoints.
	 * @returns DebugBreakpointSection page object
	 */
	async getBreakpointSection(): Promise<DebugBreakpointSection> {
		const content = this.getContent();
		return content.getSection(DebugBreakpointSection.locators.DebugBreakpointSection.predicate, DebugBreakpointSection);
	}

	/**
	 * Select a given launch configuration
	 * @param title title of the configuration to select
	 */
	async selectLaunchConfiguration(title: string): Promise<void> {
		const contextView = await this.openLaunchDropdown();
		const option = await contextView.findElement(DebugView.locators.DebugView.optionByName(title));
		// context-view-pointerBlock overlays the list and intercepts regular clicks —
		// use JavaScript click to bypass it.
		await this.getDriver().executeScript('arguments[0].click()', option);
		// Wait for the overlay to be dismissed so subsequent operations are not blocked.
		await this.getDriver()
			.wait(until.elementIsNotVisible(contextView), 2000)
			.catch(() => {
				// If already gone, that's fine.
			});
	}

	/**
	 * Opens the launch config dropdown overlay, waiting until it is visible.
	 * If it is already open (context-view-pointerBlock present) the click is skipped.
	 * @returns the context-view element to scope subsequent searches against
	 */
	private async openLaunchDropdown(): Promise<WebElement> {
		// context-view persists in the DOM between uses (display:none when closed).
		// Only click to open if it is not currently visible.
		const existingViews = await this.getDriver().findElements(DebugView.locators.ContextMenu.contextView);
		const isOpen = existingViews.length > 0 && (await existingViews[0].isDisplayed());

		if (!isOpen) {
			const action = await this.getTitlePart().findElement(DebugView.locators.DebugView.launchCombo);
			await action.click();
		}

		const contextView = await this.getDriver().wait(until.elementLocated(DebugView.locators.ContextMenu.contextView), 2000);
		await this.getDriver().wait(until.elementIsVisible(contextView), 2000);
		// Wait until at least one option row is present inside the overlay
		await this.getDriver().wait(async () => (await contextView.findElements(DebugView.locators.DebugView.launchOption)).length > 0, 2000);
		return contextView;
	}

	/**
	 * Closes the launch config dropdown by sending Escape to the filter input that holds focus.
	 */
	private async closeLaunchDropdown(): Promise<void> {
		const input = await this.getDriver().findElement(By.className('action-list-filter-input'));
		await input.sendKeys('\uE00C'); // Escape
	}

	/**
	 * Start Debugging using the current launch configuration
	 */
	async start(): Promise<void> {
		const action = await this.getTitlePart().findElement(DebugView.locators.DebugView.launchCombo);
		await action.findElement(DebugView.locators.DebugView.startButton).click();
	}

	/**
	 * Get Call Stack section
	 * @returns CallStackSection page object
	 */
	async getCallStackSection(): Promise<DebugCallStackSection> {
		const content = this.getContent();
		return content.getSection(DebugCallStackSection.locators.DebugCallStackSection.predicate, DebugCallStackSection);
	}

	/**
	 * Get Watch section
	 * @returns WatchSection page object
	 */
	async getWatchSection(): Promise<WatchSection> {
		const content = this.getContent();
		return content.getSection(WatchSection.locators.WatchSection.predicate, WatchSection);
	}
}
