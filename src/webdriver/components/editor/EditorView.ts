import { AbstractElement } from "../AbstractElement";
import { TextEditor } from "../../../extester";
import { By, WebElement } from "selenium-webdriver";
import * as path from 'path';
import { Editor } from "./Editor";
import { SettingsEditor } from "./SettingsEditor";

/**
 * View handling the open editors
 */
export class EditorView extends AbstractElement {
    constructor() {
        super(By.className('editor-group-container'), By.id('workbench.parts.editor'));
    }

    /**
     * Switch to an editor tab with the given title
     * @param title title of the tab
     */
    async openEditor(title: string): Promise<Editor> {
        const tab = await this.getTabByTitle(title);
        await tab.click();

        try {
            await this.findElement(By.id('workbench.editor.settings2'));
            return new SettingsEditor(this);
        } catch (err) {
            return new TextEditor(this, title);
        }
    }

    /**
     * Close an editor tab with the given title
     * @param title title of the tab
     */
    async closeEditor(title: string): Promise<void> {
        const tab = await this.getTabByTitle(title);
        const closeButton = await tab.findElement(By.className('tab-close'));
        await EditorView.driver.actions().mouseMove(tab).perform();
        await closeButton.click();
    }

    /**
     * Close all open editor tabs
     */
    async closeAllEditors(): Promise<void> {
        const tabs = await this.findElements(By.className('tab'));
        for (let i = 0; i < tabs.length; i++) {
            await EditorView.driver.actions().mouseMove(tabs[i]).perform();
            await (<WebElement>tabs.pop()).findElement(By.className('tab-close')).click();
        }
    }

    /**
     * Retrieve all open editor tab titles in an array
     */
    async getOpenEditorTitles(): Promise<string[]> {
        const tabs = await this.findElements(By.className('tab'));
        const titles = [];
        for (const tab of tabs) {
            const title = path.basename(await tab.getAttribute('title'));
            titles.push(title);
        }
        return titles;
    }

    private async getTabByTitle(title: string): Promise<WebElement> {
        const tabs = await this.findElements(By.className('tab'));
        let tab!: WebElement;
        for (const element of tabs) {
            const label = await element.getAttribute('aria-label');
            if (label.startsWith(title)) {
                tab = element;
                break;
            }
        }
        if (!tab) {
            throw new Error(`No editor with title '${title}' available`);
        }
        return tab;
    }
}