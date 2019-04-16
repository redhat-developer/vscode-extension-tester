import { AbstractElement } from "../AbstractElement";
import { By, Key } from "selenium-webdriver";

export class InputBox extends AbstractElement {
    constructor() {
        super(By.className('quick-input-widget'), By.className('monaco-workbench'));
    }

    async getMessage(): Promise<string> {
        return await this.findElement(By.className('quick-input-message')).getText();
    }

    async getPlaceHolder(): Promise<string> {
        return await this.findElement(By.className('monaco-inputbox'))
            .findElement(By.className('input')).getAttribute('placeholder');
    }

    async getText(): Promise<string> {
        return await this.findElement(By.className('monaco-inputbox'))
            .findElement(By.className('input')).getText();
    }

    async setText(text: string): Promise<void> {
        const input = await this.findElement(By.className('monaco-inputbox'))
            .findElement(By.className('input'));
        await input.sendKeys(Key.chord(InputBox.ctlKey, 'a'), text);
    }

    async hasProgress(): Promise<boolean> {
        const klass = await this.findElement(By.className('quick-input-progress'))
            .getAttribute('class');
        return klass.indexOf('done') < 0;
    }

    async getQuickPicks(): Promise<QuickPickItem[]> {
        const picks: QuickPickItem[] = [];
        const elements = await this.findElement(By.className('quick-input-list'))
            .findElement(By.className('monaco-list-rows'))
            .findElements(By.className('monaco-list-row'));
        
        for (const element of elements) {
            picks.push(new QuickPickItem(+await element.getAttribute('data-index'), this));
        }
        return picks;
    }

    async selectQuickPick(indexOrText: string | number): Promise<void> {
        const picks = await this.getQuickPicks();
        for (const pick of picks) {
            if (typeof indexOrText === 'string') {
                const text = await pick.getText();
                if (text.indexOf(indexOrText) > -1) {
                    return pick.select();
                }
            } else if (indexOrText === pick.getIndex()){
                return pick.select();
            }
        }
    }

    async confirm(): Promise<void> {
        const input = await this.findElement(By.className('monaco-inputbox'))
            .findElement(By.className('input'));
        await input.sendKeys(Key.ENTER);
    }

    async cancel(): Promise<void> {
        const input = await this.findElement(By.className('monaco-inputbox'))
            .findElement(By.className('input'));
        await input.sendKeys(Key.ESCAPE);
    }
}

export class QuickPickItem extends AbstractElement {
    private index: number;

    constructor(index: number, input: InputBox) {
        super(By.xpath(`.//div[contains(@class, 'monaco-list-row') and @data-index='${index}']`), input);
        this.index = index;
    }

    async getText(): Promise<string> {
        return await this.findElement(By.className('monaco-highlighted-label')).getText();
    }

    getIndex(): number {
        return this.index;
    }

    async select(): Promise<void> {
        await this.click();
    }
}