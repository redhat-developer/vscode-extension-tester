import { AbstractElement } from "../AbstractElement";
import { By } from "selenium-webdriver";
import { Notification, CenterNotification, NotificationType } from "./Notification";

/**
 * Notifications center page object
 */
export class NotificationsCenter extends AbstractElement {
    constructor() {
        super(By.className('notifications-center'), By.className('monaco-workbench'));
    }

    /**
     * Close the notifications center
     */
    async close(): Promise<void> {
        if (await this.isDisplayed()) {
            await this.findElement(By.className('hide-all-notifications-action')).click();
        }
    }

    /**
     * Clear all notifications in the notifications center
     * Note that this will also hide the notifications center
     */
    async clearAllNotifications(): Promise<void> {
        await this.findElement(By.className('clear-all-notifications-action')).click();
    }

    /**
     * Get all notifications of a given type
     * @param type type of the notifications to look for,
     * NotificationType.Any will retrieve all notifications
     */
    async getNotifications(type: NotificationType): Promise<Notification[]> {
        const notifications: Notification[] = [];
        const elements = await this.findElements(By.className('monaco-list-row'));

        for (const element of elements) {
            const not = new CenterNotification(+await element.getAttribute('data-index'));
            if (type === NotificationType.Any || await not.getType() === type) {
                notifications.push(await not.wait());
            }
        }
        return notifications;
    }
}