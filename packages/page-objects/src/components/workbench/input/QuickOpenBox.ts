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

import { Input, QuickPickItem } from "../../..";
import { until } from "selenium-webdriver";

/**
 * @deprecated as of VS Code 1.44.0, quick open box has been replaced with input box
 * The quick open box variation of the input
 */
export class QuickOpenBox extends Input {
    constructor() {
        super(QuickOpenBox.locators.QuickOpenBox.constructor, QuickOpenBox.locators.Workbench.constructor);
    }

    /**
     * Construct a new QuickOpenBox instance after waiting for its underlying element to exist
     * Use when a quick open box is scheduled to appear.
     */
    static async create(): Promise<QuickOpenBox> {
        await QuickOpenBox.driver.wait(until.elementLocated(QuickOpenBox.locators.QuickOpenBox.constructor));
        return new QuickOpenBox().wait();
    }

    async hasProgress(): Promise<boolean> {
        const klass = await this.findElement(QuickOpenBox.locators.QuickOpenBox.progress)
            .getAttribute('class');
        return klass.indexOf('done') < 0;
    }

    async getQuickPicks(): Promise<QuickPickItem[]> {
        const picks: QuickPickItem[] = [];
        const tree = await this.getDriver().wait(until.elementLocated(QuickOpenBox.locators.QuickOpenBox.quickList), 1000);
        const elements = await tree.findElements(QuickOpenBox.locators.QuickOpenBox.row);
        for (const element of elements) {
            const index = +await element.getAttribute('aria-posinset');
            if (await element.isDisplayed()) {
                picks.push(await new QuickPickItem(index, this).wait());
            }
        }
        return picks;
    }
}