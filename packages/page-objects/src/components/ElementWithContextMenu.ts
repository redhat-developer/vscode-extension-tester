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

import { AbstractElement } from './AbstractElement';
import { ContextMenu } from '..';
import { until, error, WebElement } from 'selenium-webdriver';
import { ChromiumWebDriver } from 'selenium-webdriver/chromium';

/**
 * Abstract element that has a context menu
 */
export abstract class ElementWithContextMenu extends AbstractElement {
	/**
	 * Open context menu on the element
	 */
	async openContextMenu(): Promise<ContextMenu> {
		return await this.withRecovery(async (self) => {
			const workbench = await self.getDriver().findElement(ElementWithContextMenu.locators.Workbench.constructor);
			const menus = await workbench.findElements(ElementWithContextMenu.locators.ContextMenu.contextView);

			if (menus.length < 1) {
				await self.getDriver().actions().contextClick(self).perform();
				await self.getDriver().wait(until.elementLocated(ElementWithContextMenu.locators.ContextMenu.contextView), 2000);
				return new ContextMenu(workbench).wait();
			} else if ((await workbench.findElements(ElementWithContextMenu.locators.ContextMenu.viewBlock)).length > 0) {
				await self.getDriver().actions().contextClick(self).perform();
				try {
					await self.getDriver().wait(until.elementIsNotVisible(self), 1000);
				} catch (err) {
					if (!(err instanceof error.StaleElementReferenceError)) {
						throw err;
					}
				}
			}
			await self.getDriver().actions().contextClick(self).perform();

			return new ContextMenu(workbench).wait();
		});
	}

	/**
	 * Since VS Code ~1.133 some context menus (notably the text editor's) render
	 * inside an open shadow root on a `.shadow-root-host` element attached
	 * directly to the workbench, instead of the document-level `.context-view`
	 * container. Which shape a given install uses is not strictly version-bound,
	 * so poll for either: resolve the menu from the shadow root when it appears,
	 * or return undefined as soon as the legacy container shows up (or the
	 * timeout runs out) so the caller can take the regular `.context-view` path.
	 */
	protected async waitForShadowRootMenu(timeout: number = 2000): Promise<ContextMenu | undefined> {
		const driver = this.getDriver();
		const end = Date.now() + timeout;
		while (Date.now() < end) {
			const hosts = await driver.findElements(ElementWithContextMenu.locators.ContextMenu.shadowRootHost);
			for (const host of hosts) {
				try {
					const container = await this.menuContainerInShadowRoot(host);
					if (container && (await container.isDisplayed())) {
						return await new ContextMenu(host, container).wait();
					}
				} catch (err) {
					// the host or menu got removed mid-check - keep polling
				}
			}
			const legacy = await driver.findElements(ElementWithContextMenu.locators.ContextMenu.contextView);
			for (const view of legacy) {
				if (await view.isDisplayed().catch(() => false)) {
					return undefined;
				}
			}
			await new Promise((res) => setTimeout(res, 100));
		}
		return undefined;
	}

	private async menuContainerInShadowRoot(host: WebElement): Promise<WebElement | undefined> {
		const driver = this.getDriver();
		const capabilities = await (driver as ChromiumWebDriver).getCapabilities();
		const chromiumVersion = capabilities.getBrowserVersion();
		if (chromiumVersion && Number.parseInt(chromiumVersion.split('.')[0]) >= 96) {
			const shadowRoot = await host.getShadowRoot();
			const containers = await shadowRoot.findElements(ElementWithContextMenu.locators.ContextMenu.constructor);
			return containers.length > 0 ? containers[0] : undefined;
		}
		return (await driver.executeScript(
			'return arguments[0].shadowRoot ? arguments[0].shadowRoot.querySelector(".monaco-menu-container") : undefined;',
			host,
		)) as WebElement | undefined;
	}
}
