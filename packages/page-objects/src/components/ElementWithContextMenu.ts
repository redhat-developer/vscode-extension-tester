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
import { until, error } from 'selenium-webdriver';

/**
 * Abstract element that has a context menu
 */
export abstract class ElementWithContexMenu extends AbstractElement {
	/**
	 * Open context menu on the element
	 */
	async openContextMenu(): Promise<ContextMenu> {
		const workbench = await this.getDriver().findElement(ElementWithContexMenu.locators.Workbench.constructor);
		const menus = await workbench.findElements(ElementWithContexMenu.locators.ContextMenu.contextView);

		if (menus.length < 1) {
			await this.getDriver().actions().contextClick(this).perform();
			await this.getDriver().wait(until.elementLocated(ElementWithContexMenu.locators.ContextMenu.contextView), 2000);
			return new ContextMenu(workbench).wait();
		} else if ((await workbench.findElements(ElementWithContexMenu.locators.ContextMenu.viewBlock)).length > 0) {
			await this.getDriver().actions().contextClick(this).perform();
			try {
				await this.getDriver().wait(until.elementIsNotVisible(this), 1000);
			} catch (err) {
				if (!(err instanceof error.StaleElementReferenceError)) {
					throw err;
				}
			}
		}
		await this.getDriver().actions().contextClick(this).perform();

		return new ContextMenu(workbench).wait();
	}
}
