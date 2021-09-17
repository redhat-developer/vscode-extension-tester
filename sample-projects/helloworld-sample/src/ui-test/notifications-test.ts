import { expect } from 'chai';
import { Notification, NotificationType, VSBrowser, Workbench } from 'vscode-extension-tester';


describe('Sample notifications tests', () => {
    beforeEach(async () => {
        // Execute the Hello World command from the command palette
        // this command is going to display a notification
        await new Workbench().executeCommand('hello world');

        // Wait for a notification to appear with a timeout of 2 seconds
        // The result is cast to Notification because our wait condition may return undefined
        await VSBrowser.instance.driver.wait(() => { return notificationExists('Hello'); }, 2000) as Notification;
    });

    // The first type of notifications is the standalone one
    // Standalone notifications are the ones that pop up and usually disappear after a while
    it('Standalone notifications', async () => {
        // retrieve all currently shown notifications
        const notifications = await new Workbench().getNotifications();

        // find the one we are interested in
        let notification!: Notification;
        for (const not of notifications) {
            const message = await not.getMessage();
            if (message.includes('Hello')) {
                notification = not;
            }
        }
        
        expect(await notification.getText()).equals('Hello World!');
        expect(await notification.getSource()).has.string('helloworld-sample');
        expect(await notification.getType()).equals(NotificationType.Info);

        // and we can manually dismiss the notification
        await notification.dismiss();
    });

    // Another way to look at notifications is to open the notifications center
    // Notifications there usually stay untill dismissed
    it('Notifications Center', async () => {
        const center = await new Workbench().openNotificationsCenter();

        // get notifications from the notifications center
        // this time they can be filtered by type
        // lets get info notifications only
        const notifications = await center.getNotifications(NotificationType.Info);

        // once again we can look for the hello notification
        let notification!: Notification;
        for (const not of notifications) {
            const message = await not.getMessage();
            if (message.includes('Hello')) {
                notification = not;
            }
        }

        expect(await notification.getText()).equals('Hello World!');
        expect(await notification.getSource()).has.string('helloworld-sample');
        expect(await notification.getType()).equals(NotificationType.Info);

        // this time we can clear all notifications
        await center.clearAllNotifications();
    });
});

/**
 * Example wait condition for WebDriver. Wait for a notification with given text to appear.
 * Wait conditions resolve when the first truthy value is returned.
 * In this case we choose to return the first matching notification object we find,
 * or undefined if no such notification is found.
 */
async function notificationExists(text: string): Promise<Notification | undefined> {
    const notifications = await new Workbench().getNotifications();
    for (const notification of notifications) {
        const message = await notification.getMessage();
        if (message.indexOf(text) >= 0) {
            return notification;
        }
    }
}