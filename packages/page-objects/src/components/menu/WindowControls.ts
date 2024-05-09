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

import { AbstractElement } from "../AbstractElement";
import { TitleBar } from "../..";
import { WebElement } from "selenium-webdriver";

/**
 * Page object for the windows controls part of the title bar
 */
export class WindowControls extends AbstractElement {
    constructor(bar: TitleBar = new TitleBar()) {
        super(WindowControls.locators.WindowControls.constructor, bar);
    }

    /**
     * Use the minimize window button
     * @returns Promise resolving when minimize button is pressed
     */
    async minimize(): Promise<void> {
        const minButton = await this.findElement(WindowControls.locators.WindowControls.minimize);
        await minButton.click();
    }

    /**
     * Use the maximize window button if the window is not maximized
     * @returns Promise resolving when maximize button is pressed
     */
    async maximize(): Promise<void> {
        let maxButton: WebElement;
        try {
            maxButton = await this.findElement(WindowControls.locators.WindowControls.maximize);
            await maxButton.click();
        } catch (err) {
            console.log('Window is already maximized');
        }
    }

    /**
     * Use the restore window button if the window is maximized
     * @returns Promise resolving when restore button is pressed
     */
    async restore(): Promise<void> {
        let maxButton: WebElement;
        try {
            maxButton = await this.findElement(WindowControls.locators.WindowControls.restore);
            await maxButton.click();
        } catch (err) {
            console.log('Window is not maximized');
        }
    }

    /**
     * Use the window close button. Use at your own risk.
     * @returns Promise resolving when close button is pressed
     */
    async close(): Promise<void> {
        const closeButton = await this.findElement(WindowControls.locators.WindowControls.close);
        await closeButton.click();
    }
}