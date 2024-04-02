import { until, WebElement } from 'selenium-webdriver';
import { AbstractElement } from '../AbstractElement';

export class Breakpoint extends AbstractElement {
    constructor(breakpoint: WebElement, private lineElement: WebElement) {
        super(breakpoint, lineElement);
    }

    async isEnabled(): Promise<boolean> {
        return await Breakpoint.locators.TextEditor.breakpoint.properties.enabled(this);
    }

    async isPaused(): Promise<boolean> {
        return await Breakpoint.locators.TextEditor.breakpoint.properties.paused(this);
    }

    /**
     * Return line number of the breakpoint.
     * @returns number indicating line where breakpoint is set
     */
    async getLineNumber(): Promise<number> {
        const breakpointLocators = Breakpoint.locators.TextEditor.breakpoint;
        const line = await this.lineElement.findElement(breakpointLocators.properties.line.selector);
        const lineNumber = await breakpointLocators.properties.line.number(line);
        return lineNumber;
    }

    /**
     * Remove breakpoint.
     * @param timeout time in ms when operation is considered to be unsuccessful
     */
    async remove(timeout: number = 5000): Promise<void> {
        await this.click();
        await this.getDriver().wait(until.stalenessOf(this), timeout);
    }
}