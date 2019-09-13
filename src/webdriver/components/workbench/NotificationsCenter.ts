import { AbstractElement } from "../AbstractElement";
import { Notification, CenterNotification, NotificationType } from "./Notification";

/**
 * Notifications center page object
 */
export class NotificationsCenter extends AbstractElement {
    constructor() {
        super(NotificationsCenter.locators.NotificationsCenter.constructor, NotificationsCenter.locators.Workbench.constructor);
    }

    /**
     * Close the notifications center
     */
    async close(): Promise<void> {
        if (await this.isDisplayed()) {
            await this.findElement(NotificationsCenter.locators.NotificationsCenter.close).click();
        }
    }

    /**
     * Clear all notifications in the notifications center
     * Note that this will also hide the notifications center
     */
    async clearAllNotifications(): Promise<void> {
        await this.findElement(NotificationsCenter.locators.NotificationsCenter.clear).click();
    }

    /**
     * Get all notifications of a given type
     * @param type type of the notifications to look for,
     * NotificationType.Any will retrieve all notifications
     */
    async getNotifications(type: NotificationType): Promise<Notification[]> {
        const notifications: Notification[] = [];
        const elements = await this.findElements(NotificationsCenter.locators.NotificationsCenter.row);

        for (const element of elements) {
            const not = new CenterNotification(+await element.getAttribute('data-index'));
            if (type === NotificationType.Any || await not.getType() === type) {
                notifications.push(await not.wait());
            }
        }
        return notifications;
    }
}