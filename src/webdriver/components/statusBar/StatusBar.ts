import { AbstractElement } from "../AbstractElement";
import { By } from "selenium-webdriver";

/**
 * Page object for the status bar at the bottom
 */
export class StatusBar extends AbstractElement {
    constructor() {
        super(By.id('workbench.parts.statusbar'), By.className('monaco-workbench'));
    }

    /**
     * Open/Close notification centre
     * @param open true to open, false to close
     */
    async toggleNotificationsCentre(open: boolean): Promise<void> {
        let visible = false;
        try {
            const klass = await this.enclosingItem.findElement(By.className('notifications-center')).getAttribute('class');
            visible = klass.indexOf('visible') > -1;
        } catch (err) {
            // element doesn't exist until the button is first clicked
        }
        if (visible !== open) {
            await this.findElement(By.className('octicon-bell')).click();
        }
    }

    /**
     * Open the language selection quick pick
     * Only works with an open editor
     */
    async openLanguageSelection(): Promise<void> {
        await this.findElement(By.className('editor-status-mode')).click();
    }

    /**
     * Get the current language label text
     * Only works with an open editor
     */
    async getCurrentLanguage(): Promise<string> {
        return await this.findElement(By.className('editor-status-mode')).getText();
    }

    /**
     * Open the quick pick for line endings selection
     * Only works with an open editor
     */
    async openLineEndingSelection(): Promise<void> {
        await this.findElement(By.className('editor-status-eol')).click();
    }

    /**
     * Get the currently selected line ending as text
     * Only works with an open editor
     */
    async getCurrentLineEnding(): Promise<string> {
        return await this.findElement(By.className('editor-status-eol')).getText();
    }

    /**
     * Open the encoding selection quick pick
     * Only works with an open editor
     */
    async openEncodingSelection(): Promise<void> {
        await this.findElement(By.className('editor-status-encoding')).click();
    }

    /**
     * Get the name of the current encoding as text
     * Only works with an open editor
     */
    async getCurrentEncoding(): Promise<string> {
        return await this.findElement(By.className('editor-status-encoding')).getText();
    }

    /**
     * Open the indentation selection quick pick
     * Only works with an open editor
     */
    async openIndentationSelection(): Promise<void> {
        await this.findElement(By.className('editor-status-indentation')).click();
    }

    /**
     * Get the current indentation option label as text
     * Only works with an open editor
     */
    async getCurrentIndentation(): Promise<string> {
        return await this.findElement(By.className('editor-status-indentation')).getText();
    }

    /**
     * Open the line selection input box
     * Only works with an open editor
     */
    async openLineSelection(): Promise<void> {
        await this.findElement(By.className('editor-status-selection')).click();
    }

    /**
     * Get the current editor coordinates as text
     * Only works with an open editor
     */
    async getCurrentPosition(): Promise<string> {
        return await this.findElement(By.className('editor-status-selection')).getText();
    }
}