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

/* eslint-disable no-redeclare */
import { IRectangle, WebElement } from 'selenium-webdriver';
import { AbstractElement } from '../AbstractElement';
import WebviewMixin from '../WebviewMixin';

/**
 * Page object representing a user-contributed panel implemented using a Webview.
 */
class WebviewViewBase extends AbstractElement {
	constructor() {
		super(WebviewViewBase.locators.Workbench.constructor);
	}

	async getViewToSwitchTo(): Promise<WebElement | undefined> {
		const container = await this.getRect();
		const frames = await this.getDriver().findElements(WebviewViewBase.locators.WebView.iframe);

		const scoreRect = (rect: IRectangle) => {
			const ax = Math.max(container.x, rect.x);
			const ay = Math.max(container.y, rect.y);
			const bx = Math.min(container.x + container.width, rect.x + rect.width);
			const by = Math.min(container.y + container.width, rect.y + rect.height);
			return (bx - ax) * (by - ay);
		};

		let bestRectIdx = 0;
		for (let i = 1; i < frames.length; i++) {
			if (scoreRect(await frames[i].getRect()) > scoreRect(await frames[bestRectIdx].getRect())) {
				bestRectIdx = i;
			}
		}
		return frames[bestRectIdx];
	}
}

export const WebviewView = WebviewMixin(WebviewViewBase);
export type WebviewView = InstanceType<typeof WebviewView>;
