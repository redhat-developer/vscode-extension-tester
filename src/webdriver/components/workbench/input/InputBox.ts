import { Input, QuickPickItem } from "../../../../extester";

/**
 * Plain input box variation of the input page object
 */
export class InputBox extends Input {
    constructor() {
        super(InputBox.locators.InputBox.constructor, InputBox.locators.Workbench.constructor);
    }

    /**
     * Get the message below the input field
     */
    async getMessage(): Promise<string> {
        return await this.findElement(InputBox.locators.InputBox.message).getText();
    }

    async hasProgress(): Promise<boolean> {
        const klass = await this.findElement(InputBox.locators.InputBox.progress)
            .getAttribute('class');
        return klass.indexOf('done') < 0;
    }

    async getQuickPicks(): Promise<QuickPickItem[]> {
        const picks: QuickPickItem[] = [];
        const elements = await this.findElement(InputBox.locators.InputBox.quickList)
            .findElement(InputBox.locators.InputBox.rows)
            .findElements(InputBox.locators.InputBox.row);
        
        for (const element of elements) {
            picks.push(await new QuickPickItem(+await element.getAttribute('data-index'), this).wait());
        }
        return picks;
    }

    /**
     * Find whether the input is showing an error
     */
    async hasError(): Promise<boolean> {
        const klass = await this.findElement(InputBox.locators.Input.inputBox).getAttribute('class');
        return klass.indexOf('error') > -1;
    }

    /**
     * Check if the input field is masked (input type password)
     */
    async isPassword(): Promise<boolean> {
        const input = await this.findElement(InputBox.locators.Input.input);
        return await input.getAttribute('type') === 'password';
    }
}