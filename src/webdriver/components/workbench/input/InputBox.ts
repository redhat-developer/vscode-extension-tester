import { By } from "selenium-webdriver";
import { Input, QuickPickItem } from "../../../../extester";

/**
 * Plain input box variation of the input page object
 */
export class InputBox extends Input {
    constructor() {
        super(By.className('quick-input-widget'), By.className('monaco-workbench'));
    }

    /**
     * Get the message below the input field
     */
    async getMessage(): Promise<string> {
        return await this.findElement(By.className('quick-input-message')).getText();
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
            picks.push(await new QuickPickItem(+await element.getAttribute('data-index'), this).wait());
        }
        return picks;
    }
}