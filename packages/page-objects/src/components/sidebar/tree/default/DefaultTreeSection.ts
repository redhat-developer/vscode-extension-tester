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

import { TreeSection } from "../TreeSection";
import { TreeItem } from "../../../..";
import { Key } from 'selenium-webdriver';
import { DefaultTreeItem } from "./DefaultTreeItem";

/**
 * Default view section
 */
export class DefaultTreeSection extends TreeSection {
    async getVisibleItems(): Promise<TreeItem[]> {
        const items: TreeItem[] = [];
        const elements = await this.findElements(DefaultTreeSection.locators.DefaultTreeSection.itemRow);
        for (const element of elements) {
            items.push(await new DefaultTreeItem(element, this).wait());
        }
        return items;
    }

    async findItem(label: string, maxLevel: number = 0): Promise<TreeItem | undefined> {
        await this.expand();
        const container = await this.findElement(DefaultTreeSection.locators.DefaultTreeSection.rowContainer);
        await container.sendKeys(Key.HOME);
        let item: TreeItem | undefined = undefined;
        do {
            const temp = await container.findElements(DefaultTreeSection.locators.DefaultTreeItem.ctor(label));
            if (temp.length > 0) {
                const level = +await temp[0].getAttribute(DefaultTreeSection.locators.ViewSection.level);
                if (maxLevel < 1 || level <= maxLevel) {
                    item = await new DefaultTreeItem(temp[0], this).wait();
                }
            } 
            if (!item) {
                const lastrow = await container.findElements(DefaultTreeSection.locators.DefaultTreeSection.lastRow);
                if (lastrow.length > 0) {
                    break;
                }
                await container.sendKeys(Key.PAGE_DOWN);
            }
        } while (!item);

        return item;
    }
}