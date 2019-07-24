// Import all the necessary objects from extension tester
import { Notification, VSBrowser, Workbench, WebDriver } from 'vscode-extension-tester';

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
        const notification = await driver.wait(() => { return notificationExists(); }, 2000) as Notification;

        // Assert the notification indeed says Hello World!
        expect(await notification.getMessage()).equals('Hello World!');
    });
});

/**
 * Example wait condition for WebDriver. Wait for a notification to appear.
 * Wait conditions resolve when the first truthy value is returned.
 * In this case we choose to return the first notification object we find,
 * or undefined if none is found.
 */
async function notificationExists(): Promise<Notification | undefined> {
    const notifications = await new Workbench().getNotifications();
    if (notifications.length > 0) {
        return notifications[0];
    }
}