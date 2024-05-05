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

import { ViewSection } from "../ViewSection";
import { TreeItem } from "../ViewItem";
import { error } from "selenium-webdriver";

export class TreeItemNotFoundError extends error.NoSuchElementError {
    constructor(msg?: string) {
        super(msg);
        this.name = 'TreeItemNotFoundError';
    }
}

/**
 * Abstract representation of a view section containing a tree
 */
export abstract class TreeSection extends ViewSection {
    async openItem(...path: string[]): Promise<TreeItem[]> {
        let items: TreeItem[] = [];

        for (let i = 0; i < path.length; i++) {
            const item = await this.findItem(path[i], i + 1);
            if (await item?.hasChildren() && !await item?.isExpanded()) {
                await item?.expand();
            }
        }

        let currentItem = await this.findItem(path[0], 1);
        for (let i = 0; i < path.length; i++) {
            if (!currentItem) {
                if (i === 0) {
                    items = await this.getVisibleItems();
                }
                let names = await Promise.all(items.map(item => item.getLabel()));
                names = names.sort((a, b) => a > b ? 1 : (a < b ? -1 : 0));
                const message = names.length < 1 ? `Current directory is empty.` : `Available items in current directory: [${names.toString()}]`;

                throw new TreeItemNotFoundError(`Item '${path[i]}' not found. ${message}`);
            }
            items = await currentItem.getChildren();
            if (items.length < 1) {
                await currentItem.select();
                return items;
            }
            if (i + 1 < path.length) {
                currentItem = undefined;
                for (const item of items) {
                    if (await item.getLabel() === path[i + 1]) {
                        currentItem = item;
                        break;
                    }
                }
            }
        }
        return items;
    }

    abstract findItem(label: string, maxLevel?: number): Promise<TreeItem | undefined>;
    abstract getVisibleItems(): Promise<TreeItem[]>;
}
