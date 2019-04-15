import { ElementWithContexMenu } from "../ElementWithContextMenu";
import { By } from "selenium-webdriver";
import { AbstractElement } from "../AbstractElement";

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
     */
    async getMessage(): Promise<string> {
        return await this.findElement(By.className('notification-list-item-message')).getText();
    }

    /**
     * Get the type of the notification
     */
    async getType(): Promise<NotificationType> {
        const iconType = await this.findElement(By.className('notification-list-item-icon')).getAttribute('class');
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
     */
    async getSource(): Promise<string> {
        return await this.findElement(By.className('notification-list-item-source')).getAttribute('title');
    }

    /**
     * Find whether the notification has an active progress bar
     */
    async hasProgress(): Promise<boolean> {
        const klass = await this.findElement(By.className('monaco-progress-container')).getAttribute('class');
        return klass.indexOf('done') < 0;
    }

    /**
     * Dismiss the notification
     */
    async dismiss(): Promise<void> {
        await this.findElement(By.className('clear-notification-action')).click();
    }

    /**
     * Get the action buttons of the notification as an array
     * of NotificationButton objects
     */
    async getActions(): Promise<NotificationButton[]> {
        const buttons: NotificationButton[] = [];
        const elements = await this.findElement(By.className('notification-list-item-buttons-container'))
            .findElements(By.className('monaco-button'));

        for (const button of elements) {
            buttons.push(new NotificationButton(await button.getAttribute('title'), this));
        }
        return buttons;
    }

    /**
     * Click on an action button with the given title
     * @param title title of the action/button
     */
    async takeAction(title: string): Promise<void> {
        await new NotificationButton(title, this).click();
    }
}

/**
 * Notification displayed on its own in the notifications-toasts container
 */
export class StandaloneNotification extends Notification {
    constructor(id: string) {
        super(By.xpath(`.//div[contains(@class, 'monaco-list-row') and @id='${id}']`), By.className('notifications-toasts'));
    }
}

/**
 * Notification displayed within the notifications center
 */
export class CenterNotification extends Notification {
    constructor(index: number) {
        super(By.xpath(`.//div[contains(@class, 'monaco-list-row') and @data-index='${index}']`), By.className('notifications-center'));
    }
}

/**
 * Notification button
 */
class NotificationButton extends AbstractElement {
    private title: string;

    constructor(title: string, notification: Notification) {
        super(By.xpath(`.//a[@role='button' and @title='${title}']`), notification);
        this.title = title;
    }

    getTitle(): string {
        return this.title;
    }
}