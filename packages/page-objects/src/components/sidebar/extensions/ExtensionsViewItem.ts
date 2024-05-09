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

import { ViewItem } from "../ViewItem";
import { until, WebElement } from "selenium-webdriver";
import { ContextMenu } from "../../menu/ContextMenu";
import { ExtensionsViewSection } from "./ExtensionsViewSection";

/**
 * Page object representing an extension in the extensions view
 */
export class ExtensionsViewItem extends ViewItem {

    constructor(extensionElement: WebElement, section: ExtensionsViewSection) {
        super(extensionElement, section);
    }

    /**
     * Get title of the extension
     */
    async getTitle(): Promise<string> {
        const title = await this.findElement(ExtensionsViewItem.locators.ExtensionsViewSection.itemTitle);
        return await title.getText();
    }

    /**
     * Get version of the extension
     * @returns Promise resolving to version string
     */
    async getVersion(): Promise<string> {
        const version = await this.findElements(ExtensionsViewItem.locators.ExtensionsViewItem.version);
        if (version.length > 0) {
            return await version[0].getText();
        }
        const label = await this.getAttribute('aria-label');
        const ver = label.split(',')[1].trim();

        return ver;
    }

    /**
     * Get the author of the extension
     * @returns Promise resolving to displayed author
     */
    async getAuthor(): Promise<string> {
        const author = await this.findElement(ExtensionsViewItem.locators.ExtensionsViewItem.author);
        return await author.getText();
    }

    /**
     * Get the description of the extension
     * @returns Promise resolving to description
     */
    async getDescription(): Promise<string> {
        const description = await this.findElement(ExtensionsViewItem.locators.ExtensionsViewItem.description);
        return await description.getText();
    }
    
    /**
     * Find if the extension is installed
     * @returns Promise resolving to true/false
     */
    async isInstalled(): Promise<boolean> {
        const button = await this.findElement(ExtensionsViewItem.locators.ExtensionsViewItem.install);
        if ((await button.getAttribute('class')).indexOf('disabled') > -1) {
            return true;
        }
        return false;
    }

    /**
     * Open the management context menu if the extension is installed
     * @returns Promise resolving to ContextMenu object
     */
    async manage(): Promise<ContextMenu> {
        await this.getDriver().wait(until.elementLocated(ExtensionsViewItem.locators.ExtensionsViewItem.manage), 1000);
        const button = await this.enclosingItem.findElement(ExtensionsViewItem.locators.ExtensionsViewItem.manage);
        if ((await button.getAttribute('class')).indexOf('disabled') > -1) {
            throw new Error(`Extension '${await this.getTitle()}' is not installed`);
        }
        return await this.openContextMenu();
    }

    /**
     * Install the extension if not installed already.
     * 
     * Will wait for the extension to finish installing. To skip the wait, set timeout to 0.
     * 
     * @param timeout timeout to wait for the installation in milliseconds, default unlimited, set to 0 to skip waiting
     * @returns Promise resolving when the installation finishes or is skipped
     */
    async install(timeout: number = 300000): Promise<void> {
        if (await this.isInstalled()) {
            return;
        }
        const button = await this.findElement(ExtensionsViewItem.locators.ExtensionsViewItem.install);
        const manage = await this.findElement(ExtensionsViewItem.locators.ExtensionsViewItem.manage);
        await button.click();

        if (timeout > 0) {
            await this.getDriver().wait(until.elementIsVisible(manage), timeout);
        }
    }
}