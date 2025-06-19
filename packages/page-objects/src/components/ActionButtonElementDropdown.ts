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

import { ContextMenu } from './menu/ContextMenu';
import { AbstractElement } from './AbstractElement';
import { By } from 'selenium-webdriver';

export abstract class ActionButtonElementDropdown extends AbstractElement {
	async open(): Promise<ContextMenu> {
		await this.click();
		await this.getDriver().sleep(500);
		const shadowRootHost = await this.enclosingItem.findElements(ActionButtonElementDropdown.locators.ContextMenu.shadowRootHost);
		const actions = this.getDriver().actions();
		await actions.clear();

		if (shadowRootHost.length > 0) {
			if ((await this.getAttribute('aria-expanded')) !== 'true') {
				await this.click();
				await this.getDriver().sleep(500);
			}
			const shadowRoot = await shadowRootHost[0].getShadowRoot();
			return new ContextMenu(await shadowRoot.findElement(By.className('monaco-menu-container'))).wait();
		} else {
			const workbench = await this.getDriver().findElement(ActionButtonElementDropdown.locators.Workbench.constructor);
			return new ContextMenu(workbench).wait();
		}
	}
}
