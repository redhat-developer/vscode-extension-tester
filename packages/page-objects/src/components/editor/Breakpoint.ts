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

import { until, WebElement } from 'selenium-webdriver';
import { AbstractElement } from '../AbstractElement';

export class Breakpoint extends AbstractElement {
    constructor(breakpoint: WebElement, private lineElement: WebElement) {
        super(breakpoint, lineElement);
    }

    async isEnabled(): Promise<boolean> {
        return await Breakpoint.locators.TextEditor.breakpoint.properties.enabled(this);
    }

    async isPaused(): Promise<boolean> {
        return await Breakpoint.locators.TextEditor.breakpoint.properties.paused(this);
    }

    /**
     * Return line number of the breakpoint.
     * @returns number indicating line where breakpoint is set
     */
    async getLineNumber(): Promise<number> {
        const breakpointLocators = Breakpoint.locators.TextEditor.breakpoint;
        const line = await this.lineElement.findElement(breakpointLocators.properties.line.selector);
        const lineNumber = await breakpointLocators.properties.line.number(line);
        return lineNumber;
    }

    /**
     * Remove breakpoint.
     * @param timeout time in ms when operation is considered to be unsuccessful
     */
    async remove(timeout: number = 5000): Promise<void> {
        await this.click();
        await this.getDriver().wait(until.stalenessOf(this), timeout);
    }
}