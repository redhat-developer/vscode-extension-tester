import { AbstractElement } from "../AbstractElement";
import { TextEditor } from "../..";
import { error, WebElement } from "selenium-webdriver";
import { Editor } from "./Editor";
import { SettingsEditor } from "./SettingsEditor";
import { WebView } from "./WebView";
import { DiffEditor } from './DiffEditor';
import { ElementWithContexMenu } from "../ElementWithContextMenu";

export class EditorTabNotFound extends Error {
    constructor(title: string, group: number) {
        super(`No editor with title '${title}' in group '${group}' available`);
    }
}


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
        if (groupIndex !== undefined) {
            return groups[groupIndex].closeAllEditors();
        }

        while (groups.length > 0 && (await groups[0].getOpenEditorTitles()).length > 0) {
            await groups[0].closeAllEditors();
            await new Promise(res => setTimeout(res, 1000));
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
     * Retrieve an editor tab from a given group by title
     * @param title title of the tab
     * @param groupIndex zero based index of the editor group, default 0 (leftmost one)
     * @returns promise resolving to EditorTab object
     */
    async getTabByTitle(title: string, groupIndex: number = 0): Promise<EditorTab> {
        const group = await this.getEditorGroup(groupIndex);
        return group.getTabByTitle(title);
    }

    /**
     * Retrieve all open editor tabs
     * @param groupIndex index of group to search for tabs, if left undefined, all groups are searched
     * @returns promise resolving to EditorTab list
     */
    async getOpenTabs(groupIndex?: number): Promise<EditorTab[]> {
        const groups = await this.getEditorGroups();
        if (groupIndex !== undefined) {
            return groups[groupIndex].getOpenTabs();
        }
        const tabs: EditorTab[] = [];
        for (const group of groups) {
            tabs.push(...(await group.getOpenTabs()));
        }
        return tabs;
    }

    /**
     * Retrieve the active editor tab
     * @returns promise resolving to EditorTab object, undefined if no tab is active
     */
    async getActiveTab(): Promise<EditorTab | undefined> {
        const tabs = await this.getOpenTabs();

        for (const tab of tabs) {
            if (await tab.isSelected()) {
                return tab;
            }
        }

        return undefined;
    }

    /**
     * Retrieve all editor groups in a list, sorted left to right
     * @returns promise resolving to an array of EditorGroup objects
     */
    async getEditorGroups(): Promise<EditorGroup[]> {
        const elements = await this.findElements(EditorGroup.locators.EditorView.editorGroup);
        const groups = await Promise.all(elements.map(async (element, index) => new EditorGroup(element, this, index).wait()));

        // sort the groups by x coordinates, so the leftmost is always at index 0
        for (let i = 0; i < groups.length - 1; i++) {
            for (let j = 0; j < groups.length - i - 1; j++) {
                if ((await groups[j].getRect()).x > (await groups[j + 1].getRect()).x) {
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

    /**
     * Get editor actions of a select editor group
     * @param groupIndex zero based index of the editor group (leftmost group has index 0), default 0
     * @returns promise resolving to list of WebElement objects
     */
    async getActions(groupIndex = 0): Promise<WebElement[]> {
        const group = await this.getEditorGroup(groupIndex);
        return group.getActions();
    }

    /**
     * Get editor action of a select editor group, search by title
     * @param groupIndex zero based index of the editor group (leftmost group has index 0), default 0
     * @returns promise resolving to WebElement object if found, undefined otherwise
     */
    async getAction(title: string, groupIndex = 0): Promise<WebElement | undefined> {
        const group = await this.getEditorGroup(groupIndex);
        return group.getAction(title);
    }
}

/**
 * Page object representing an editor group
 */
export class EditorGroup extends AbstractElement {
    constructor(element: WebElement, view: EditorView = new EditorView(), private index: number = 0) {
        super(element, view);
    }

    /**
     * Switch to an editor tab with the given title
     * @param title title of the tab
     * @returns Promise resolving to Editor object
     */
    async openEditor(title: string): Promise<Editor> {
        const tab = await this.getTabByTitle(title);
        await tab.select();

        try {
            await this.findElement(EditorView.locators.EditorView.settingsEditor);
            return new SettingsEditor(this).wait();
        } catch (err) {
            try {
                await this.findElement(EditorView.locators.EditorView.webView);
                return new WebView(this).wait();
            } catch (err) {
                try {
                    await this.findElement(EditorView.locators.EditorView.diffEditor);
                    return new DiffEditor(this).wait();
                } catch (err) {
                    return new TextEditor(this).wait();
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
        await EditorView.driver.actions().move({ origin: tab }).perform();
        const closeButton = await tab.findElement(EditorView.locators.EditorView.closeTab);
        await closeButton.click();
    }

    /**
     * Close all open editor tabs
     * @returns Promise resolving once all tabs have had their close button pressed
     */
    async closeAllEditors(): Promise<void> {
        let titles = await this.getOpenEditorTitles();
        while (titles.length > 0) {
            await this.closeEditor(titles[0]);
            try {
                // check if the group still exists
                await this.getTagName();
            } catch (err) {
                break;
            }
            titles = await this.getOpenEditorTitles();
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
            try {
                const title = await new EditorTab(tab, this.enclosingItem as EditorView).getTitle();
                titles.push(title);
            }
            catch (e) {
                if (e instanceof error.StaleElementReferenceError) {
                    continue;
                }
                throw e;
            }
        }
        return titles;
    }

    /**
     * Retrieve an editor tab by title
     * @param title title of the tab
     * @returns promise resolving to EditorTab object
     */
    async getTabByTitle(title: string): Promise<EditorTab> {
        const tabs = await this.findElements(EditorView.locators.EditorView.tab);
        for (const element of tabs) {
            try {
                const tab = new EditorTab(element, this.enclosingItem as EditorView);
                const label = await tab.getTitle();
                if (label === title) {
                    return tab;
                }
            }
            catch (e) {
                if (e instanceof error.StaleElementReferenceError) {
                    continue;
                }
                throw e;
            }
        }
        throw new EditorTabNotFound(title, this.index);
    }

    /**
     * Retrieve all open editor tabs
     * @returns promise resolving to EditorTab list
     */
    async getOpenTabs(): Promise<EditorTab[]> {
        const tabs = await this.findElements(EditorView.locators.EditorView.tab);
        return Promise.all(tabs.map(async tab => new EditorTab(tab, this.enclosingItem as EditorView).wait()));
    }

    /**
     * Retrieve the active editor tab
     * @returns promise resolving to EditorTab object, undefined if no tab is active
     */
    async getActiveTab(): Promise<EditorTab | undefined> {
        const tabs = await this.getOpenTabs();

        for (const tab of tabs) {
            if (await tab.isSelected()) {
                return tab;
            }
        }

        return undefined;
    }

    /**
     * Retrieve the editor action buttons as WebElements
     * @returns promise resolving to list of WebElement objects
     */
    async getActions(): Promise<WebElement[]> {
        return this.findElement(EditorGroup.locators.EditorView.actionContainer).findElements(EditorGroup.locators.EditorView.actionItem);
    }

    /**
     * Find an editor action button by title
     * @param title title of the button
     * @returns promise resolving to WebElement representing the button if found, undefined otherwise
     */
    async getAction(title: string): Promise<WebElement | undefined> {
        const actions = await this.getActions();
        for (const item of actions) {
            if (await item.getAttribute('title') === title) {
                return item;
            }
        }
        return undefined;
    }
}

/**
 * Page object for editor view tab
 */
export class EditorTab extends ElementWithContexMenu {
    constructor(element: WebElement, view: EditorView) {
        super(element, view);
    }

    /**
     * Get the tab title as string
     */
    async getTitle(): Promise<string> {
        const label = await this.findElement(EditorTab.locators.Editor.title);
        return label.getText();
    }

    /**
     * Select (click) the tab
     */
    async select(): Promise<void> {
        await this.click();
    }

    async isSelected(): Promise<boolean> {
        const klass = await this.getAttribute('class');
        const segments = klass?.split(/\s+/g) ?? [];
        return await super.isSelected() || segments.includes('active');
    }
}