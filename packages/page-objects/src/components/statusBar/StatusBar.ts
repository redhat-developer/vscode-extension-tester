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

import { By, Locator, WebElement, error } from "selenium-webdriver";
import { AbstractElement } from "../AbstractElement";
import { NotificationsCenter } from "../workbench/NotificationsCenter";

/**
 * Page object for the status bar at the bottom
 */
export class StatusBar extends AbstractElement {
    constructor() {
        super(StatusBar.locators.StatusBar.constructor, StatusBar.locators.Workbench.constructor);
    }

    /**
     * Retrieve all status bar items currently displayed
     * @returns Promise resolving to an array of WebElement
     */
    async getItems(): Promise<WebElement[]> {
        return await this.findElements(StatusBar.locators.StatusBar.item);
    }

    /**
     * Find status bar item by title/visible label
     * @param title title of the item
     * @returns Promise resolving to a WebElement if item is found, to undefined otherwise
     */
    async getItem(title: string): Promise<WebElement | undefined> {
        const items = await this.getItems();
        for (const item of items) {
            try {
                if (await item.getAttribute(StatusBar.locators.StatusBar.itemTitle) === title) {
                    return item;
                }
            } catch (err) {
                if (!(err instanceof error.StaleElementReferenceError)) {
                    throw err;
                }
            }
        }
        return undefined;
    }

    /**
     * Open the notifications center
     * @returns Promise resolving to NotificationsCenter object
     */
    async openNotificationsCenter(): Promise<NotificationsCenter> {
        await this.toggleNotificationsCentre(true);
        return new NotificationsCenter();
    }

    /**
     * Close the notifications center
     * @returns Promise resolving when the notifications center is closed
     */
    async closeNotificationsCenter(): Promise<void> {
        await this.toggleNotificationsCentre(false);
    }

    /**
     * Open the language selection quick pick
     * Only works with an open editor
     * @returns Promise resolving when the language selection is opened
     */
    async openLanguageSelection(): Promise<void> {
        await this.findElement(StatusBar.locators.StatusBar.language).click();
    }

    /**
     * Get the current language label text
     * Only works with an open editor
     * @returns Promise resolving to string representation of current language
     */
    async getCurrentLanguage(): Promise<string> {
        return await this.getPartText(StatusBar.locators.StatusBar.language);
    }

    /**
     * Open the quick pick for line endings selection
     * Only works with an open editor
     * @returns Promise resolving when the line ending selection is opened
     */
    async openLineEndingSelection(): Promise<void> {
        await this.findElement(StatusBar.locators.StatusBar.lines).click();
    }

    /**
     * Get the currently selected line ending as text
     * Only works with an open editor
     * @returns Promise resolving to string representation of current line ending
     */
    async getCurrentLineEnding(): Promise<string> {
        return await this.getPartText(StatusBar.locators.StatusBar.lines);
    }

    /**
     * Open the encoding selection quick pick
     * Only works with an open editor
     * @returns Promise resolving when the encoding selection is opened
     */
    async openEncodingSelection(): Promise<void> {
        await this.findElement(StatusBar.locators.StatusBar.encoding).click();
    }

    /**
     * Get the name of the current encoding as text
     * Only works with an open editor
     * @returns Promise resolving to string representation of current encoding
     */
    async getCurrentEncoding(): Promise<string> {
        return await this.getPartText(StatusBar.locators.StatusBar.encoding);
    }

    /**
     * Open the indentation selection quick pick
     * Only works with an open editor
     * @returns Promise resolving when the indentation selection is opened
     */
    async openIndentationSelection(): Promise<void> {
        await this.findElement(StatusBar.locators.StatusBar.indent).click();
    }

    /**
     * Get the current indentation option label as text
     * Only works with an open editor
     * @returns Promise resolving to string representation of current indentation
     */
    async getCurrentIndentation(): Promise<string> {
        return await this.getPartText(StatusBar.locators.StatusBar.indent);
    }

    /**
     * Open the line selection input box
     * Only works with an open editor
     * @returns Promise resolving when the line selection is opened
     */
    async openLineSelection(): Promise<void> {
        await this.findElement(StatusBar.locators.StatusBar.selection).click();
    }

    /**
     * Get the current editor coordinates as text
     * Only works with an open editor
     * @returns Promise resolving to string representation of current position in the editor
     */
    async getCurrentPosition(): Promise<string> {
        return await this.getPartText(StatusBar.locators.StatusBar.selection);
    }

    /**
     * Open/Close notification centre
     * @param open true to open, false to close
     */
    private async toggleNotificationsCentre(open: boolean): Promise<void> {
        let visible = false;
        try {
            const klass = await this.enclosingItem.findElement(StatusBar.locators.StatusBar.notifications).getAttribute('class');
            visible = klass.indexOf('visible') > -1;
        } catch (err) {
            // element doesn't exist until the button is first clicked
        }
        if (visible !== open) {
            await this.findElement(StatusBar.locators.StatusBar.bell).click();
        }
    }

    private async getPartText(locator: Locator): Promise<string> {
        return await this.findElement(locator).findElement(By.css('a')).getAttribute('innerHTML');
    }
}