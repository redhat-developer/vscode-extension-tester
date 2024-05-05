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

import { EditorGroup } from "./EditorView";
import { AbstractElement } from "../AbstractElement";
import { WebElement } from "../..";

export class EditorAction extends AbstractElement {
    constructor(element: WebElement, parent: EditorGroup) {
        super(element, parent);
    }

    /**
     * Get text description of the action.
     */
    async getTitle(): Promise<string> {
        return await this.getAttribute(EditorAction.locators.EditorView.attribute);
    }
}
