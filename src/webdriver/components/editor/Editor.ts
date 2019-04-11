import { ElementWithContexMenu } from "../ElementWithContextMenu";
import { EditorView, ContentAssist } from "../../../extester";
import { By, Key } from "selenium-webdriver";
import { fileURLToPath } from "url";
import * as clipboard from 'clipboardy';

/**
 * Page object representing the active editor
 */
export class Editor extends ElementWithContexMenu {
    constructor(view: EditorView = new EditorView()) {
        super(By.className('editor-instance'), view);
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
        await inputarea.sendKeys(Key.chord(Editor.ctlKey, 'a'));
        await inputarea.sendKeys(Key.chord(Editor.ctlKey, 'c'));
        const text = clipboard.readSync();
        await inputarea.click();
        return text;
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
     * Get number of lines in the editor
     */
    async getNumberOfLines(): Promise<number> {
        const lineBox = await this.findElement(By.className(`view-lines`));
        const lines = await lineBox.findElements(By.className('view-line'));
        return lines.length;
    }

    //  TODO: add text manipulation

    // private async getLinesInOrder(modifier: string = 'lines'): Promise<WebElement[]> {
    //     const lineBox = await this.findElement(By.className(`view-${modifier}`));
    //     let lines!: WebElement[];
    //     if (modifier === 'lines') {
    //         lines = await lineBox.findElements(By.className('view-line'));
    //     } else {
    //         lines = await lineBox.findElements(By.xpath('./*'));
    //     }
    //     const regex = /([0-9]+)(?=px;.)/g;

    //     for (let i = 0; i < lines.length; i++) {
    //         for (let j = 0; j < i; j++) {
    //             const current = +(<RegExpMatchArray>(await lines[j].getAttribute('style')).match(regex))[0];
    //             const next = +(<RegExpMatchArray>(await lines[j+1].getAttribute('style')).match(regex))[0];
    //             if (next < current) {
    //                 const temp = lines[j];
    //                 lines[j] = lines[j+1];
    //                 lines[j+1] = temp;
    //             }
    //         }
    //     }
    //     return lines;
    // }
}