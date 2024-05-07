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

import { expect } from 'chai';
import { ActivityBar } from 'vscode-extension-tester';

describe('ActivityBar', () => {
    let bar: ActivityBar;

    before(() => {
        bar = new ActivityBar();
    });

    it('getViewControls finds view containers', async () => {
        const controls = await bar.getViewControls();
        expect(controls.length).greaterThan(0);
    });

    it('getViewControl works with the correct label', async () => {
        const explorer = await bar.getViewControl('Explorer');
        expect(explorer).not.undefined;
    });

    it('getViewControl returns undefined with an invalid label', async () => {
        const item = await bar.getViewControl('whatever');
        expect(item).undefined;
    });

    it('getGlobalActions finds global action containers', async () => {
        const actions = await bar.getGlobalActions();
        expect(actions.length).greaterThan(0);
    });

    it('getGlobalAction finds action container with the given label', async () => {
        const action = await bar.getGlobalAction('Manage');
        expect(action).not.undefined;
    });

    it('getGlobalAction returns undefined with nonexistent label', async () => {
        const action = await bar.getGlobalAction('whatever');
        expect(action).undefined;
    });

    (process.platform === 'darwin' ? it.skip : it)('openContextMenu shows context menu', async () => {
        const menu = await bar.openContextMenu();
        expect(await menu.isDisplayed()).is.true;
        await menu.close();
    });
});