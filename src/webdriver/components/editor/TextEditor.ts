import { ContentAssist } from "../../../extester";
import { Key } from "selenium-webdriver";
import { fileURLToPath } from "url";
import * as clipboard from 'clipboardy';
import { StatusBar } from "../statusBar/StatusBar";
import { Editor } from "./Editor";

/**
 * Page object representing the active editor
 */
export class TextEditor extends Editor {

    /**
     * Find whether the active editor has unsaved changes
     * @returns Promise resolving to true/false
     */
    async isDirty(): Promise<boolean> {
        const tab = await this.enclosingItem.findElement(TextEditor.locators.TextEditor.activeTab);
        const klass = await tab.getAttribute('class');
        return klass.indexOf('dirty') >= 0;
    }

    /**
     * Saves the active editor
     * @returns Promise resolving when ctrl+s is invoked
     */
    async save(): Promise<void> {
        const inputarea = await this.findElement(TextEditor.locators.Editor.inputArea);
        await inputarea.sendKeys(Key.chord(TextEditor.ctlKey, 's'));
    }

    /**
     * Retrieve the path to the file opened in the active editor
     * @returns Promise resolving to editor's underlying file path
     */
    async getFilePath(): Promise<string> {
        const ed = await this.findElement(TextEditor.locators.TextEditor.editorContainer);
        const url = await ed.getAttribute(TextEditor.locators.TextEditor.dataUri);
        return fileURLToPath(url);
    }

    /**
     * Open/Close the content assistant at the current position in the editor by sending the default
     * keyboard shortcut signal
     * @param open true to open, false to close
     * @returns Promise resolving to ContentAssist object when opening, void otherwise
     */
    async toggleContentAssist(open: boolean): Promise<ContentAssist | void> {
        const inputarea = await this.findElement(TextEditor.locators.Editor.inputArea);
        const assist = await this.findElement(TextEditor.locators.ContentAssist.constructor)
        const klass = await assist.getAttribute('class');
        const visibility = await assist.getCssValue('visibility');

        if (open) {
            if (klass.indexOf('visible') < 0 || visibility === 'hidden') {
                await inputarea.sendKeys(Key.chord(Key.CONTROL, Key.SPACE));
            }
            const assist = await new ContentAssist(this).wait();
            await this.getDriver().wait(() => { return assist.isLoaded(); }, 10000);
            return assist;
        } else {
            if (klass.indexOf('visible') >= 0) {
                const col = (await this.getCoordinates())[1];
                await inputarea.sendKeys(Key.LEFT);
                await inputarea.sendKeys(Key.RIGHT);
                if (col < 2) {
                    await inputarea.sendKeys(Key.LEFT);
                }
            }
        }
    }

    /**
     * Get all text from the editor
     * @returns Promise resolving to editor text
     */
    async getText(): Promise<string> {
        const inputarea = await this.findElement(TextEditor.locators.Editor.inputArea);
        await inputarea.sendKeys(Key.chord(TextEditor.ctlKey, 'a'), Key.chord(TextEditor.ctlKey, 'c'));
        const text = clipboard.readSync();
        await inputarea.getDriver().actions().sendKeys(Key.UP).perform();
        return text;
    }

    /**
     * Replace the contents of the editor with a given text
     * @param text text to type into the editor
     * @param formatText format the new text, default false
     * @returns Promise resolving once the new text is copied over
     */
    async setText(text: string, formatText: boolean = false): Promise<void> {
        const inputarea = await this.findElement(TextEditor.locators.Editor.inputArea);
        clipboard.writeSync(text);
        await inputarea.sendKeys(Key.chord(TextEditor.ctlKey, 'a'), Key.chord(TextEditor.ctlKey, 'v'));
        if (formatText) {
            await this.formatDocument();
        }
    }

    /**
     * Deletes all text within the editor
     * @returns Promise resolving once the text is deleted
     */
    async clearText(): Promise<void> {
        const inputarea = await this.findElement(TextEditor.locators.Editor.inputArea);
        await inputarea.sendKeys(Key.chord(TextEditor.ctlKey, 'a'));
        await inputarea.sendKeys(Key.BACK_SPACE);
    }

    /**
     * Get text from a given line
     * @param line number of the line to retrieve
     * @returns Promise resolving to text at the given line number
     */
    async getTextAtLine(line: number): Promise<string> {
        const text = await this.getText();
        const lines = text.split('\n');
        if (line < 1 || line > lines.length) {
            throw new Error(`Line number ${line} does not exist`);
        }
        return lines[line - 1];
    }

    /**
     * Replace the contents of a line with a given text
     * @param line number of the line to edit
     * @param text text to set at the line
     * @returns Promise resolving when the text is typed in
     */
    async setTextAtLine(line: number, text: string): Promise<void> {
        if (line < 1 || line > await this.getNumberOfLines()) {
            throw new Error(`Line number ${line} does not exist`);
        }
        const lines = (await this.getText()).split('\n');
        lines[line - 1] = text;
        await this.setText(lines.join('\n'));
    }

    /**
     * Add the given text to the given coordinates
     * @param line number of the line to type into
     * @param column number of the column to start typing at
     * @param text text to add
     * @returns Promise resolving when the text is typed in
     */
    async typeText(line: number, column: number, text: string): Promise<void> {
        await this.moveCursor(line, column);
        const inputarea = await this.findElement(TextEditor.locators.Editor.inputArea);
        await inputarea.sendKeys(text);
    }

    /**
     * Move the cursor to the given coordinates
     * @param line line number to move to
     * @param column column number to move to
     * @returns Promise resolving when the cursor has reached the given coordinates
     */
    async moveCursor(line: number, column: number): Promise<void> {
        if (line < 1 || line > await this.getNumberOfLines()) {
            throw new Error(`Line number ${line} does not exist`);
        }
        if (column < 1) {
            throw new Error(`Column number ${column} does not exist`);
        }
        const inputarea = await this.findElement(TextEditor.locators.Editor.inputArea);
        let coordinates = await this.getCoordinates();
        const lineGap = coordinates[0] - line;
        const lineKey = lineGap >= 0 ? Key.UP : Key.DOWN;
        for (let i = 0; i < Math.abs(lineGap); i++) {
            inputarea.sendKeys(lineKey);
        }

        coordinates = await this.getCoordinates();
        const columnGap = coordinates[1] - column;
        const columnKey = columnGap >= 0 ? Key.LEFT : Key.RIGHT;
        for (let i = 0; i < Math.abs(columnGap); i++) {
            inputarea.sendKeys(columnKey);
            if ((await this.getCoordinates())[0] != coordinates[0]) {
                throw new Error(`Column number ${column} is not accessible on line ${line}`);
            }
        }
    }

    /**
     * Get number of lines in the editor
     * @returns Promise resolving to number of lines
     */
    async getNumberOfLines(): Promise<number> {
        const lines = (await this.getText()).split('\n');
        return lines.length;
    }

    /**
     * Use the built-in 'Format Document' option to format the text
     * @returns Promise resolving when the Format Document command is invoked
     */
    async formatDocument(): Promise<void> {
        const menu = await this.openContextMenu();
        try {
            await menu.select('Format Document');
        } catch (err) {
            console.log('Warn: Format Document not available for selected language');
        }
    }

    /**
     * Get coordinates as number array [line, column]
     */
    private async getCoordinates(): Promise<number[]> {
        const coords: number[] = [];
        const statusBar = new StatusBar();
        const coordinates = <RegExpMatchArray>(await statusBar.getCurrentPosition()).match(/\d+/g);
        for(const c of coordinates) {
            coords.push(+c);
        }
        return coords;
    }
}