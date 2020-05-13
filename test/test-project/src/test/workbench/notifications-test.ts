import { expect } from 'chai';
import { NotificationsCenter, Workbench, NotificationType, Notification, until } from 'vscode-extension-tester';

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

        it('getType returns notificationYype', async () => {
            const type = await notification.getType();
            expect(type).equals(NotificationType.Info);
        });

        it('hasProgress works', async () => {
            const prog = await notification.hasProgress();
            expect(prog).is.false;
        });

        it('getActions looks for action buttons', async () => {
            const actions = await notification.getActions();
            expect(actions.map(item => item.getTitle())).deep.equals(['Yes', 'No']);
        });

        it('getSource returns title of origin', async () => {
            const source = await notification.getSource();
            expect(source).has.string('Test Project');
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
    });
});