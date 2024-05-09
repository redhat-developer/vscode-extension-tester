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

import { ElementWithContexMenu } from "../ElementWithContextMenu";
import { AbstractElement } from "../AbstractElement";
import { By, SideBarView } from "../..";

/**
 * Page object representing the top (title) part of a side bar view
 */
export class ViewTitlePart extends ElementWithContexMenu {
    constructor(view: SideBarView = new SideBarView()) {
        super(ViewTitlePart.locators.ViewTitlePart.constructor, view);
    }

    /**
     * Returns the displayed title of the view
     * @returns Promise resolving to displayed title
     */
    async getTitle(): Promise<string> {
        return await this.findElement(ViewTitlePart.locators.ViewTitlePart.title).getText();
    }

    /**
     * Finds action buttons inside the view title part
     * @returns Promise resolving to array of TitleActionButton objects
     */
    async getActions(): Promise<TitleActionButton[]> {
        const actions: TitleActionButton[] = [];
        const elements = await this.findElements(ViewTitlePart.locators.ViewTitlePart.action);
        for (const element of elements) {
            const title = await element.getAttribute(ViewTitlePart.locators.ViewTitlePart.actionLabel);
            actions.push(await new TitleActionButton(TitleActionButton.locators.ViewTitlePart.actionConstructor(title), this).wait());
        }
        return actions;
    }

    /**
     * Finds an action button by title
     * @param title title of the button to search for
     * @returns Promise resolving to TitleActionButton object
     */
    async getAction(title: string): Promise<TitleActionButton> {
        return new TitleActionButton(TitleActionButton.locators.ViewTitlePart.actionConstructor(title), this);
    }
}

/**
 * Page object representing a button inside the view title part
 */
export class TitleActionButton extends AbstractElement {

    constructor(actionConstructor: By, viewTitle: ViewTitlePart) {
        super(actionConstructor, viewTitle);
    }

    /**
     * Get title of the button
     */
    async getTitle(): Promise<string> {
        return await this.getAttribute(TitleActionButton.locators.ViewTitlePart.actionLabel);
    }
}
