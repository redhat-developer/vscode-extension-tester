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
import { ActivityBar, ContextMenu } from "../..";
import { ElementWithContexMenu } from "../ElementWithContextMenu";

/**
 * Page object representing the global action controls on the bottom of the action bar
 */
export class ActionsControl extends ElementWithContexMenu {
    constructor(element: WebElement, bar: ActivityBar) {
        super(element, bar);
    }

    /**
     * Open the context menu bound to this global action
     * @returns Promise resolving to ContextMenu object representing the action's menu
     */
    async openActionMenu(): Promise<ContextMenu> {
        return await this.openContextMenu();
    }

    /**
     * Returns the title of the associated action
     */
    async getTitle(): Promise<string> {
        return await this.getAttribute('aria-label');
    }
}