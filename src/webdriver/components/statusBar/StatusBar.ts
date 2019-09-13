import { AbstractElement } from "../AbstractElement";
import { NotificationsCenter } from "../workbench/NotificationsCenter";

/**
 * Page object for the status bar at the bottom
 */
export class StatusBar extends AbstractElement {
    constructor() {
        super(StatusBar.locators.StatusBar.constructor, StatusBar.locators.Workbench.constructor);
    }

    /**
     * Open the notifications center
     */
    async openNotificationsCenter(): Promise<NotificationsCenter> {
        await this.toggleNotificationsCentre(true);
        return new NotificationsCenter();
    }

    /**
     * Close the notifications center
     */
    async closeNotificationsCenter(): Promise<void> {
        await this.toggleNotificationsCentre(false);
    }

    /**
     * Open the language selection quick pick
     * Only works with an open editor
     */
    async openLanguageSelection(): Promise<void> {
        await this.findElement(StatusBar.locators.StatusBar.language).click();
    }

    /**
     * Get the current language label text
     * Only works with an open editor
     */
    async getCurrentLanguage(): Promise<string> {
        return await this.findElement(StatusBar.locators.StatusBar.language).getText();
    }

    /**
     * Open the quick pick for line endings selection
     * Only works with an open editor
     */
    async openLineEndingSelection(): Promise<void> {
        await this.findElement(StatusBar.locators.StatusBar.lines).click();
    }

    /**
     * Get the currently selected line ending as text
     * Only works with an open editor
     */
    async getCurrentLineEnding(): Promise<string> {
        return await this.findElement(StatusBar.locators.StatusBar.lines).getText();
    }

    /**
     * Open the encoding selection quick pick
     * Only works with an open editor
     */
    async openEncodingSelection(): Promise<void> {
        await this.findElement(StatusBar.locators.StatusBar.encoding).click();
    }

    /**
     * Get the name of the current encoding as text
     * Only works with an open editor
     */
    async getCurrentEncoding(): Promise<string> {
        return await this.findElement(StatusBar.locators.StatusBar.encoding).getText();
    }

    /**
     * Open the indentation selection quick pick
     * Only works with an open editor
     */
    async openIndentationSelection(): Promise<void> {
        await this.findElement(StatusBar.locators.StatusBar.indent).click();
    }

    /**
     * Get the current indentation option label as text
     * Only works with an open editor
     */
    async getCurrentIndentation(): Promise<string> {
        return await this.findElement(StatusBar.locators.StatusBar.indent).getText();
    }

    /**
     * Open the line selection input box
     * Only works with an open editor
     */
    async openLineSelection(): Promise<void> {
        await this.findElement(StatusBar.locators.StatusBar.selection).click();
    }

    /**
     * Get the current editor coordinates as text
     * Only works with an open editor
     */
    async getCurrentPosition(): Promise<string> {
        return await this.findElement(StatusBar.locators.StatusBar.selection).getText();
    }

    /**
     * Open/Close notification centre
     * @param open true to open, false to close
     */
    private async toggleNotificationsCentre(open: boolean): Promise<void> {
        let visible = false;
        try {
            const klass = await this.enclosingItem.findElement(StatusBar.locators.StatusBar.notifications).getAttribute('class');
            visible = klass.indexOf('visible') > -1;
        } catch (err) {
            // element doesn't exist until the button is first clicked
        }
        if (visible !== open) {
            await this.findElement(StatusBar.locators.StatusBar.bell).click();
        }
    }
}