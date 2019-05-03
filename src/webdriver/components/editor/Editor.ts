import { ElementWithContexMenu } from "../ElementWithContextMenu";
import { EditorView, ContentAssist } from "../../../extester";
import { By, Key } from "selenium-webdriver";
import { fileURLToPath } from "url";
import * as clipboard from 'clipboardy';
import { StatusBar } from "../statusBar/StatusBar";

/**
 * Page object representing the active editor
 */
export class Editor extends ElementWithContexMenu {
    private title: string;

    constructor(view: EditorView = new EditorView(), title: string) {
        super(By.className('editor-instance'), view);
        this.title = title;
    }

    /**
     * Find whether the active editor has unsaved changes
     */
    async isDirty(): Promise<boolean> {
        const tab = await this.enclosingItem.findElement(By.css('div.tab.active'));
        const klass = await tab.getAttribute('class');
        return klass.indexOf('dirty') >= 0;
    }

    /**
     * Saves the active editor
     */
    async save(): Promise<void> {
        const inputarea = await this.findElement(By.className('inputarea'));
        await inputarea.sendKeys(Key.chord(Editor.ctlKey, 's'));
    }

    /**
     * Retrieve the path to the file opened in the active editor
     */
    async getFilePath(): Promise<string> {
        const ed = await this.findElement(By.className('monaco-editor'));
        const url = await ed.getAttribute('data-uri');
        return fileURLToPath(url);
    }

    /**
     * Open/Close the content assistant at the current position in the editor by sending the default
     * keyboard shortcut signal
     * @param open true to open, false to close
     */
    async toggleContentAssist(open: boolean): Promise<ContentAssist | void> {
        const inputarea = await this.findElement(By.className('inputarea'));
        const klass = await this.findElement(By.className('suggest-widget')).getAttribute('class');
        
        if (open) {
            if (klass.indexOf('visible') < 0) {
                await inputarea.sendKeys(Key.chord(Key.CONTROL, Key.SPACE));
            }
            return new ContentAssist(this).wait();
        } else {
            if (klass.indexOf('visible') >= 0) {
                await inputarea.sendKeys(Key.ESCAPE);
            }
        }
    }

    /**
     * Get all text from the editor
     */
    async getText(): Promise<string> {
        const inputarea = await this.findElement(By.className('inputarea'));
        await inputarea.sendKeys(Key.chord(Editor.ctlKey, 'a'), Key.chord(Editor.ctlKey, 'c'));
        const text = clipboard.readSync();
        await inputarea.getDriver().actions().sendKeys(Key.UP).perform();
        return text;
    }

    /**
     * Replace the contents of the editor with a given text
     * @param text text to type into the editor
     * @param formatText format the new text, default true
     */
    async setText(text: string, formatText: boolean = true): Promise<void> {
        const inputarea = await this.findElement(By.className('inputarea'));
        clipboard.writeSync(text);
        await inputarea.sendKeys(Key.chord(Editor.ctlKey, 'a'), Key.chord(Editor.ctlKey, 'v'));
        if (formatText) {
            await this.formatDocument();
        }
    }

    /**
     * Get text from a given line
     * @param line number of the line to retrieve
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
     */
    async typeText(line: number, column: number, text: string): Promise<void> {
        if (line < 1 || line > await this.getNumberOfLines()) {
            throw new Error(`Line number ${line} does not exist`);
        }
        if (column < 1) {
            throw new Error(`Column number ${column} does not exist`);
        }
        const inputarea = await this.findElement(By.className('inputarea'));
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

        await inputarea.sendKeys(text);
    }

    /**
     * Get number of lines in the editor
     */
    async getNumberOfLines(): Promise<number> {
        const lines = (await this.getText()).split('\n');
        return lines.length;
    }

    /**
     * Use the built-in 'Format Document' option to format the text
     */
    async formatDocument(): Promise<void> {
        const menu = await this.openContextMenu();
        await menu.select('Format Document');
    }

    /**
     * Get title/name of the open editor
     */
    getTitle(): string {
        return this.title;
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