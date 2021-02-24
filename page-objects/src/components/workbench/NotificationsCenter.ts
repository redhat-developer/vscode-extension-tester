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
     * @returns Promise resolving when the center is closed
     */
    async close(): Promise<void> {
        if (await this.isDisplayed()) {
            await this.findElement(NotificationsCenter.locators.NotificationsCenter.close).click();
        }
    }

    /**
     * Clear all notifications in the notifications center
     * Note that this will also hide the notifications center
     * @returns Promise resolving when the clear all button is pressed
     */
    async clearAllNotifications(): Promise<void> {
        await (await this.findElement(NotificationsCenter.locators.NotificationsCenter.clear)).click();
    }

    /**
     * Get all notifications of a given type
     * @param type type of the notifications to look for,
     * NotificationType.Any will retrieve all notifications
     * 
     * @returns Promise resolving to array of Notification objects
     */
    async getNotifications(type: NotificationType): Promise<Notification[]> {
        const notifications: Notification[] = [];
        const elements = await this.findElements(NotificationsCenter.locators.NotificationsCenter.row);

        for (const element of elements) {
            const not = new CenterNotification(element);
            if (type === NotificationType.Any || await not.getType() === type) {
                notifications.push(await not.wait());
            }
        }
        return notifications;
    }
}