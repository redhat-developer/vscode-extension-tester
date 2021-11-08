import { ElementWithContexMenu } from "../ElementWithContextMenu";
import { EditorTab, EditorView, EditorGroup } from "../..";
import { WebElement, Locator } from 'selenium-webdriver';

/**
 * Abstract representation of an editor tab
 */
export abstract class Editor extends ElementWithContexMenu {

    constructor(view: EditorView | EditorGroup = new EditorView(), base: Locator | WebElement = Editor.locators.Editor.constructor) {
        super(base, view);
    }

    /**
     * Get title/name of the open editor
     */
    async getTitle(): Promise<string> {
        const tab = await this.getTab();
        return tab.getTitle();
    }

    /**
     * Get the corresponding editor tab
     */
    async getTab(): Promise<EditorTab> {
        const element = this.enclosingItem as EditorView | EditorGroup;
        return element.getActiveTab() as Promise<EditorTab>;
    }
}