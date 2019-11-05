// Import all the necessary objects from extension tester
import { Notification, VSBrowser, Workbench, WebDriver, NotificationType } from 'vscode-extension-tester';

// We are using chai for assertions, feel free to use whichever package you like
import { expect } from 'chai';

// Test suite is in standard Mocha BDD format
describe('Hello World Example UI Tests', () => {
    let driver: WebDriver;

    before(() => {
        // Retrieve a handle for the internal WebDriver instance so 
        // we can use all its functionality along with the tester API
        driver = VSBrowser.instance.driver;
    });

    // Test the Hello World command does what we expect
    it('Hello World Command should show a notification with the correct text', async () => {

        // Execute the Hello World command from the command palette
        await new Workbench().executeCommand('hello world');

        // Wait for a notification to appear with a timeout of 2 seconds
        // The result is cast to Notification because our wait condition may return undefined
        const notification = await driver.wait(() => { return notificationExists('Hello'); }, 2000) as Notification;

        // Assert the notification indeed says Hello World!
        expect(await notification.getMessage()).equals('Hello World!');
        expect(await notification.getType()).equals(NotificationType.Info);
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