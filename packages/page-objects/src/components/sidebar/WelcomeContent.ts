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

import { WebElement } from "selenium-webdriver";
import { AbstractElement } from "../AbstractElement";
import { ViewSection } from "../..";

/**
 * A button that appears in the welcome content and can be clicked to execute a command.
 *
 * To execute the command bound to this button simply run: `await button.click();`.
 */
export class WelcomeContentButton extends AbstractElement {
    /**
     * @param panel  The panel containing the button in the welcome section
     * @param welcomeSection  The enclosing welcome section
     */
    constructor(panel: WebElement, welcomeSection: WelcomeContentSection) {
        super(panel, welcomeSection);
    }

    /** Return the title displayed on this button */
    public async getTitle(): Promise<string> {
        return await this.getText();
    }
}

/**
 * A section in an empty custom view, see:
 * https://code.visualstudio.com/api/extension-guides/tree-view#welcome-content
 *
 * The welcome section contains two types of elements: text entries and buttons that can be bound to commands.
 * The text sections can be accessed via [[getTextSections]], the buttons on the
 * other hand via [[getButtons]].
 * This however looses the information of the order of the buttons and lines
 * with respect to each other. This can be remedied by using [[getContents]],
 * which returns both in the order that they are found (at the expense, that you
 * now must use typechecks to find out what you got).
 */
export class WelcomeContentSection extends AbstractElement {
    /**
     * @param panel  The panel containing the welcome content.
     * @param parent  The webelement in which the welcome content is embedded.
     */
    constructor(panel: WebElement, parent: ViewSection) {
        super(panel, parent);
    }

    /**
     * Combination of [[getButtons]] and [[getTextSections]]: returns all entries in the welcome view in the order that they appear.
     */
    public async getContents(): Promise<(WelcomeContentButton|string)[]> {
        const elements = await this.findElements(WelcomeContentSection.locators.WelcomeContent.buttonOrText);
        return Promise.all(elements.map(async (e) => {
            const tagName = await e.getTagName();
            if (tagName === "p") {
                return await e.getText();
            } else {
                return new WelcomeContentButton(e, this);
            }
        }));
    }

    /** Finds all buttons in the welcome content */
    public async getButtons(): Promise<WelcomeContentButton[]> {
        return (
            await this.findElements(WelcomeContentSection.locators.WelcomeContent.button)
        ).map((elem) => new WelcomeContentButton(elem, this));
    }

    /**
     * Finds all text entries in the welcome content and returns each line as an
     * element in an array.
     */
    public async getTextSections(): Promise<string[]> {
        return await Promise.all(
            (await this.findElements(WelcomeContentSection.locators.WelcomeContent.text)).map(async(elem) => await elem.getText())
        );
    }
}
