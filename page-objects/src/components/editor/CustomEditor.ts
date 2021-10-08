import { Editor, WebView, Workbench } from "../..";

/**
 * Page object for custom editors
 */
export class CustomEditor extends Editor {

    /**
     * Get the WebView object contained in the editor
     * @returns WebView page object
     */
    getWebView(): WebView {
        return new WebView();
    }

    /**
     * Check if the editor has unsaved changes
     * @returns Promise resolving to true if there are unsaved changes, false otherwise
     */
    async isDirty(): Promise<boolean> {
        const tab = await this.getTab();
        const klass = await tab.getAttribute('class');
        return klass.includes('dirty');
    }

    /**
     * Save the editor
     */
    async save(): Promise<void> {
        await new Workbench().executeCommand('file: save');
    }
}