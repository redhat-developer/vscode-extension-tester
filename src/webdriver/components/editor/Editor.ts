import { ElementWithContexMenu } from "../ElementWithContextMenu";
import { EditorView, ContentAssist } from "../../../extester";
import { By, Key } from "selenium-webdriver";
import { fileURLToPath } from "url";
import * as fs from 'fs-extra';

/**
 * Page object representing the active editor
 */
export class Editor extends ElementWithContexMenu {
    constructor(view: EditorView = new EditorView()) {
        super(By.className('editor-instance'), view);
    }

    async isDirty(): Promise<boolean> {
        const tab = await this.enclosingItem.findElement(By.css('div.tab.active'));
        const klass = await tab.getAttribute('class');
        return klass.indexOf('dirty') >= 0;
    }

    async save(): Promise<void> {
        const inputarea = await this.findElement(By.className('inputarea'));
        await inputarea.sendKeys(Key.chord(Key.CONTROL, 's'));
    }

    async getFilePath(): Promise<string> {
        const ed = await this.findElement(By.className('monaco-editor'));
        const url = await ed.getAttribute('data-uri');
        return fileURLToPath(url);
    }

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

    async getText(): Promise<string> {
        const file = await this.getFilePath();
        return fs.readFileSync(file).toString();
    }

    async getTextAtLine(line: number): Promise<string> {
        const text = await this.getText();
        const lines = text.split('\n');
        if (line < 1 || line > lines.length) {
            throw new Error(`Line number ${line} does not exist`);
        }
        return lines[line - 1];
    } 

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