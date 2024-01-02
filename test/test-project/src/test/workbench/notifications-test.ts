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
        chai.expect(notifications).not.empty;
    });

    it('clearAllNotifications works', async function () {
        this.timeout(8000);
        await new Workbench().executeCommand('hello world');
        await center.getDriver().sleep(500);
        center = await new Workbench().openNotificationsCenter();
        await center.getDriver().sleep(500);
        const notifications = await center.getNotifications(NotificationType.Any);
        chai.expect(notifications).not.empty;

        await center.clearAllNotifications();
        await center.getDriver().sleep(1000);
        chai.expect(await center.isDisplayed()).is.false;
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
            chai.expect(message).has.string('This is a notification');
        });

        it('getType returns notificationType', async () => {
            const type = await notification.getType();
            chai.expect(type).equals(NotificationType.Info);
        });

        it('hasProgress works', async () => {
            const prog = await notification.hasProgress();
            chai.expect(prog).is.false;
        });

        it('getActions looks for action buttons', async () => {
            const actions = await notification.getActions();
            chai.expect(await Promise.all(actions.map(async (item) => {
                return await item.getTitle();
            }))).deep.equals(['Yes', 'No']);
        });

        it('getSource returns title of origin', async () => {
            const source = await notification.getSource();
            chai.expect(source).has.string('Test Project');
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

            chai.expect(await notification.getMessage()).to.equal("This is a warning!");
            chai.expect(await notification.getType()).to.equal(NotificationType.Warning);
            await notification.dismiss();
            await center.getDriver().wait(until.stalenessOf(notification));
        });

        it('get error notification works', async () => {
            await new Workbench().executeCommand('Error Message');
            await center.getDriver().sleep(200);
            center = await new Workbench().openNotificationsCenter();
            notification = (await center.getNotifications(NotificationType.Error))[0];

            chai.expect(await notification.getMessage()).to.equal("This is an error!");
            chai.expect(await notification.getType()).to.equal(NotificationType.Error);
            await notification.dismiss();
            await center.getDriver().wait(until.stalenessOf(notification));
        });
    });
});