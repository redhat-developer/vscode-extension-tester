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

import { ElementWithContextMenu } from './ElementWithContextMenu';
import { ContextMenu } from './menu/ContextMenu';
import { By, Key } from 'selenium-webdriver';
import { AbstractElement } from './AbstractElement';

export abstract class ActionButtonElementDropdown extends AbstractElement {
	async open(): Promise<ContextMenu> {
		await this.click();
		const shadowRootHost = await this.enclosingItem.findElements(By.className('shadow-root-host'));
		const actions = this.getDriver().actions();
		await actions.clear();
		await actions.sendKeys(Key.ESCAPE).perform();

		if (shadowRootHost.length > 0) {
			if ((await this.getAttribute('aria-expanded')) !== 'true') {
				await this.click();
			}
			const shadowRoot = await shadowRootHost[0].getShadowRoot();
			return new ContextMenu(await shadowRoot.findElement(By.className('monaco-menu-container'))).wait();
		} else {
			await this.click();
			const workbench = await this.getDriver().findElement(ElementWithContextMenu.locators.Workbench.constructor);
			return new ContextMenu(workbench).wait();
		}
	}
}
