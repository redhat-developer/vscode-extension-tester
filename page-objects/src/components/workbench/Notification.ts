import { ElementWithContexMenu } from "../ElementWithContextMenu";
import { AbstractElement } from "../AbstractElement";
import { WebElement } from "selenium-webdriver";

/**
 * Available types of notifications
 */
export enum NotificationType {
    Info = 'info',
    Warning = 'warning',
    Error = 'error',
    Any = 'any'
}

/**
 * Abstract element representing a notification
 */
export abstract class Notification extends ElementWithContexMenu {

    /**
     * Get the message of the notification
     * @returns Promise resolving to notification message
     */
    async getMessage(): Promise<string> {
        return await this.findElement(Notification.locators.Notification.message).getText();
    }

    /**
     * Get the type of the notification
     * @returns Promise resolving to NotificationType
     */
    async getType(): Promise<NotificationType> {
        const iconType = await this.findElement(Notification.locators.Notification.icon).getAttribute('class');
        if (iconType.indexOf('icon-info') > -1) {
            return NotificationType.Info;
        } else if (iconType.indexOf('icon-warning')) {
            return NotificationType.Warning;
        } else {
            return NotificationType.Error;
        }
    }

    /**
     * Get the source of the notification as text
     * @returns Promise resolving to notification source
     */
    async getSource(): Promise<string> {
        return await this.findElement(Notification.locators.Notification.source).getAttribute('title');
    }

    /**
     * Find whether the notification has an active progress bar
     * @returns Promise resolving to true/false
     */
    async hasProgress(): Promise<boolean> {
        const klass = await this.findElement(Notification.locators.Notification.progress).getAttribute('class');
        return klass.indexOf('done') < 0;
    }

    /**
     * Dismiss the notification
     * @returns Promise resolving when notification is dismissed
     */
    async dismiss(): Promise<void> {
        await this.getDriver().actions().mouseMove(this).perform();
        await this.findElement(Notification.locators.Notification.dismiss).click();
    }

    /**
     * Get the action buttons of the notification as an array
     * of NotificationButton objects
     * @returns Promise resolving to array of NotificationButton objects
     */
    async getActions(): Promise<NotificationButton[]> {
        const buttons: NotificationButton[] = [];
        const elements = await this.findElement(Notification.locators.Notification.actions)
            .findElements(Notification.locators.Notification.action);

        for (const button of elements) {
            buttons.push(await new NotificationButton(await button.getAttribute(Notification.locators.Notification.actionLabel), this).wait());
        }
        return buttons;
    }

    /**
     * Click on an action button with the given title
     * @param title title of the action/button
     * @returns Promise resolving when the select button is pressed
     */
    async takeAction(title: string): Promise<void> {
        await new NotificationButton(title, this).click();
    }
}

/**
 * Notification displayed on its own in the notifications-toasts container
 */
export class StandaloneNotification extends Notification {
    constructor(notification: WebElement) {
        super(notification, StandaloneNotification.locators.Notification.standaloneContainer);
    }
}

/**
 * Notification displayed within the notifications center
 */
export class CenterNotification extends Notification {
    constructor(notification: WebElement) {
        super(notification, CenterNotification.locators.NotificationsCenter.constructor);
    }
}

/**
 * Notification button
 */
class NotificationButton extends AbstractElement {
    private title: string;

    constructor(title: string, notification: Notification) {
        super(NotificationButton.locators.Notification.buttonConstructor(title), notification);
        this.title = title;
    }

    getTitle(): string {
        return this.title;
    }
}