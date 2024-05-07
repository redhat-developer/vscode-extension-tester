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
import { NotificationsCenter, Workbench, NotificationType, Notification, until, VSBrowser } from 'vscode-extension-tester';

describe('NotificationsCenter', () => {
    let center: NotificationsCenter;

    before(async () => {
        center = await new Workbench().openNotificationsCenter();
    });
    
    after(async () => {
        await center.close();
    });

    it('getNotifications works', async function() {
        this.timeout(4000);
        await new Workbench().executeCommand('hello world');
        await center.getDriver().sleep(500);
        center = await new Workbench().openNotificationsCenter();
        await center.getDriver().sleep(500);
        const notifications = await center.getNotifications(NotificationType.Any);
        expect(notifications).not.empty;
    });

    it('clearAllNotifications works', async function () {
        this.timeout(8000);
        await new Workbench().executeCommand('hello world');
        await center.getDriver().sleep(500);
        center = await new Workbench().openNotificationsCenter();
        await center.getDriver().sleep(500);
        const notifications = await center.getNotifications(NotificationType.Any);
        expect(notifications).not.empty;

        await center.clearAllNotifications();
        await center.getDriver().sleep(1000);
        expect(await center.isDisplayed()).is.false;
    });

    describe('Notification', () => {
        let notification: Notification;

        before(async () => {
            await new Workbench().executeCommand('test notification');
            await center.getDriver().sleep(200);
            center = await new Workbench().openNotificationsCenter();
            notification = (await center.getNotifications(NotificationType.Any))[0];
        });

        it('getMessage gets the text', async () => {
            const message = await notification.getMessage();
            expect(message).has.string('This is a notification');
        });

        it('getType returns notificationType', async () => {
            const type = await notification.getType();
            expect(type).equals(NotificationType.Info);
        });

        it('hasProgress works', async () => {
            const prog = await notification.hasProgress();
            expect(prog).is.false;
        });

        it('getActions looks for action buttons', async () => {
            const actions = await notification.getActions();
            expect(await Promise.all(actions.map(async (item) => {
                return await item.getTitle();
            }))).deep.equals(['Yes', 'No']);
        });

        it('getSource returns title of origin', async function () {
            if(VSBrowser.instance.version >= '1.88.0') {
                this.skip();
            }
            const source = await notification.getSource();
            expect(source).has.string('Test Project');
        });

        it('expand works', async () => {
            await notification.expand();
        });

        it('takeAction works', async function() {
            this.timeout(8000);
            const driver = notification.getDriver();
            await notification.takeAction('Yes');
            await driver.wait(until.stalenessOf(notification));
        });

        it('dismiss works', async () => {
            await new Workbench().executeCommand('test notification');
            await center.getDriver().sleep(200);
            center = await new Workbench().openNotificationsCenter();
            notification = (await center.getNotifications(NotificationType.Any))[0];

            const driver = notification.getDriver();
            await notification.dismiss();
            await driver.wait(until.stalenessOf(notification));
        });

        it('get warning notification works', async () => {
            await new Workbench().executeCommand('Warning Message');
            await center.getDriver().sleep(200);
            center = await new Workbench().openNotificationsCenter();
            notification = (await center.getNotifications(NotificationType.Warning))[0];

            expect(await notification.getMessage()).to.equal("This is a warning!");
            expect(await notification.getType()).to.equal(NotificationType.Warning);
            await notification.dismiss();
            await center.getDriver().wait(until.stalenessOf(notification));
        });

        it('get error notification works', async () => {
            await new Workbench().executeCommand('Error Message');
            await center.getDriver().sleep(200);
            center = await new Workbench().openNotificationsCenter();
            notification = (await center.getNotifications(NotificationType.Error))[0];

            expect(await notification.getMessage()).to.equal("This is an error!");
            expect(await notification.getType()).to.equal(NotificationType.Error);
            await notification.dismiss();
            await center.getDriver().wait(until.stalenessOf(notification));
        });
    });
});