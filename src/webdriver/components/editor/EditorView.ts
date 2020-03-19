import { AbstractElement } from "../AbstractElement";
import { TextEditor } from "../../../extester";
import { WebElement } from "selenium-webdriver";
import * as path from 'path';
import { Editor } from "./Editor";
import { SettingsEditor } from "./SettingsEditor";
import { WebView } from "./WebView";
import { DiffEditor } from './DiffEditor';

/**
 * View handling the open editors
 */
export class EditorView extends AbstractElement {
    constructor() {
        super(EditorView.locators.EditorView.constructor, EditorView.locators.Workbench.constructor);
    }

    /**
     * Switch to an editor tab with the given title
     * @param title title of the tab
     * @param groupIndex zero based index for the editor group (0 for the left most group)
     * @returns Promise resolving to Editor object
     */
    async openEditor(title: string, groupIndex: number = 0): Promise<Editor> {
        const group = await this.getEditorGroup(groupIndex);
        return group.openEditor(title);
    }

    /**
     * Close an editor tab with the given title
     * @param title title of the tab
     * @param groupIndex zero based index for the editor group (0 for the left most group)
     * @returns Promise resolving when the tab's close button is pressed
     */
    async closeEditor(title: string, groupIndex: number = 0): Promise<void> {
        const group = await this.getEditorGroup(groupIndex);
        return group.closeEditor(title);
    }

    /**
     * Close all open editor tabs
     * @param groupIndex optional index to specify an editor group
     * @returns Promise resolving once all tabs have had their close button pressed
     */
    async closeAllEditors(groupIndex?: number): Promise<void> {
        let groups = await this.getEditorGroups();
        if (groupIndex) {
            return groups[0].closeAllEditors();
        }

        while (groups.length > 0 && (await groups[0].getOpenEditorTitles()).length > 0) {
            await groups[0].closeAllEditors();
            groups = await this.getEditorGroups();
        }        
    }

    /**
     * Retrieve all open editor tab titles in an array
     * @param groupIndex optional index to specify an editor group, if left empty will search all groups
     * @returns Promise resolving to array of editor titles
     */
    async getOpenEditorTitles(groupIndex?: number): Promise<string[]> {
        const groups = await this.getEditorGroups();
        if (groupIndex !== undefined) {
            return groups[groupIndex].getOpenEditorTitles();
        }
        const titles: string[] = [];
        for (const group of groups) {
            titles.push(...(await group.getOpenEditorTitles()));
        }
        return titles;
    }

    /**
     * Retrieve all editor groups in a list, sorted left to right
     * @returns promise resolving to an array of EditorGroup objects
     */
    async getEditorGroups(): Promise<EditorGroup[]> {
        const elements = await this.findElements(EditorGroup.locators.EditorView.editorGroup);
        const groups = await Promise.all(elements.map(async (element) => new EditorGroup(element, this).wait()));
        
        // sort the groups by x coordinates, so the leftmost is always at index 0
        for (let i = 0; i < groups.length - 1; i++) {
            for (let j = 0; j < groups.length - i - 1; j++) {
                if ((await groups[j].getLocation()).x > (await groups[j + 1].getLocation()).x) {
                    let temp = groups[j];
                    groups[j] = groups[j + 1];
                    groups[j + 1] = temp;
                }
            }
        }
        return groups;
    }

    /**
     * Retrieve an editor group with a given index (counting from left to right)
     * @param index zero based index of the editor group (leftmost group has index 0)
     * @returns promise resolving to an EditorGroup object
     */
    async getEditorGroup(index: number): Promise<EditorGroup> {
        return (await this.getEditorGroups())[index];
    }
}

/**
 * Page object representing an editor group
 */
export class EditorGroup extends AbstractElement {
    constructor(element: WebElement, view: EditorView = new EditorView()) {
        super(element, view);
    }
    
    /**
     * Switch to an editor tab with the given title
     * @param title title of the tab
     * @returns Promise resolving to Editor object
     */
    async openEditor(title: string): Promise<Editor> {
        const tab = await this.getTabByTitle(title);
        await tab.click();

        try {
            await this.findElement(EditorView.locators.EditorView.settingsEditor);
            return new SettingsEditor(this);
        } catch (err) {
            try {
                await this.findElement(EditorView.locators.EditorView.webView);
                return new WebView(this, title);
            } catch (err) {
                try {
                    await this.findElement(EditorView.locators.EditorView.diffEditor);
                    return new DiffEditor(this, title);
                } catch (err) {
                    return new TextEditor(this, title);
                }
            }
        }
    }

    /**
     * Close an editor tab with the given title
     * @param title title of the tab
     * @returns Promise resolving when the tab's close button is pressed
     */
    async closeEditor(title: string): Promise<void> {
        const tab = await this.getTabByTitle(title);
        await EditorView.driver.actions().mouseMove(tab).perform();
        const closeButton = await tab.findElement(EditorView.locators.EditorView.closeTab);
        await closeButton.click();
    }

    /**
     * Close all open editor tabs
     * @returns Promise resolving once all tabs have had their close button pressed
     */
    async closeAllEditors(): Promise<void> {
        const titles = await this.getOpenEditorTitles();
        for (const title of titles) {
            await this.closeEditor(title);
        }
    }

    /**
     * Retrieve all open editor tab titles in an array
     * @returns Promise resolving to array of editor titles
     */
    async getOpenEditorTitles(): Promise<string[]> {
        const tabs = await this.findElements(EditorView.locators.EditorView.tab);
        const titles = [];
        for (const tab of tabs) {
            const title = path.basename(await tab.getAttribute(EditorView.locators.EditorView.tabTitle));
            titles.push(title);
        }
        return titles;
    }

    private async getTabByTitle(title: string): Promise<WebElement> {
        const tabs = await this.findElements(EditorView.locators.EditorView.tab);
        let tab!: WebElement;
        for (const element of tabs) {
            const label = await element.getAttribute(EditorView.locators.EditorView.tabLabel);
            if (label.startsWith(`${title}, tab`)) {
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