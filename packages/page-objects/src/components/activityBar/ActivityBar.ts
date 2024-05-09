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

import { ActionsControl, ViewControl } from "../..";
import { ElementWithContexMenu } from "../ElementWithContextMenu";

/**
 * Page object representing the left side activity bar in VS Code
 */
export class ActivityBar extends ElementWithContexMenu {
    constructor() {
        super(ActivityBar.locators.ActivityBar.constructor, ActivityBar.locators.Workbench.constructor);
    }

    /**
     * Find all view containers displayed in the activity bar
     * @returns Promise resolving to array of ViewControl objects
     */
    async getViewControls(): Promise<ViewControl[]> {
        const views: ViewControl[] = [];
        const viewContainer = await this.findElement(ActivityBar.locators.ActivityBar.viewContainer);
        for(const element of await viewContainer.findElements(ActivityBar.locators.ActivityBar.actionItem)) {
            views.push(await new ViewControl(element, this).wait());
        }
        return views;
    }

    /**
     * Find a view container with a given title
     * @param name title of the view
     * @returns Promise resolving to ViewControl object representing the view selector, undefined if not found
     */
    async getViewControl(name: string): Promise<ViewControl | undefined> {
        const controls = await this.getViewControls();
        const names = await Promise.all(controls.map(async (item) => {
            return await item.getTitle();
        }));
        const index = names.findIndex((value) => value.indexOf(name) > -1);
        if (index > -1) {
            return controls[index];
        }
        return undefined;
    }

    /**
     * Find all global action controls displayed on the bottom of the activity bar
     * @returns Promise resolving to array of ActionsControl objects
     */
    async getGlobalActions(): Promise<ActionsControl[]> {
        const actions: ActionsControl[] = [];
        const actionContainer = await this.findElement(ActivityBar.locators.ActivityBar.actionsContainer);
        for(const element of await actionContainer.findElements(ActivityBar.locators.ActivityBar.actionItem)) {
            actions.push(await new ActionsControl(element, this).wait());
        }
        return actions;
    }

    /**
     * Find an action control with a given title
     * @param name title of the global action
     * @returns Promise resolving to ActionsControl object representing the action selector, undefined if not found
     */
    async getGlobalAction(name: string): Promise<ActionsControl | undefined> {
        const actions = await this.getGlobalActions();
        const names = await Promise.all(actions.map(async (item) => {
            return await item.getTitle();
        }));
        const index = names.findIndex((value) => value.indexOf(name) > -1);
        if (index > -1) {
            return actions[index];
        }
        return undefined;
    }
}