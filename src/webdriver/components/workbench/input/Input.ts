import { AbstractElement } from "../../AbstractElement";
import { Key } from "selenium-webdriver";
import { QuickOpenBox } from "../../../../extester";

/**
 * Abstract page object for input fields
 */
export abstract class Input extends AbstractElement {

    /**
     * Get current text of the input field
     */
    async getText(): Promise<string> {
        return await this.findElement(Input.locators.Input.inputBox)
            .findElement(Input.locators.Input.input).getText();
    }

    /**
     * Set (by selecting all and typing) text in the input field
     * @param text text to set into the input field
     */
    async setText(text: string): Promise<void> {
        const input = await this.findElement(Input.locators.Input.inputBox)
            .findElement(Input.locators.Input.input);
        await input.clear();
        await input.sendKeys(text);
    }

    /**
     * Get the placeholder text for the input field
     */
    async getPlaceHolder(): Promise<string> {
        return await this.findElement(Input.locators.Input.inputBox)
            .findElement(Input.locators.Input.input).getAttribute('placeholder');
    }

    /**
     * Confirm the input field by pressing Enter
     */
    async confirm(): Promise<void> {
        const input = await this.findElement(Input.locators.Input.inputBox)
            .findElement(Input.locators.Input.input);
        await input.sendKeys(Key.ENTER);
    }

    /**
     * Cancel the input field by pressing Escape
     */
    async cancel(): Promise<void> {
        const input = await this.findElement(Input.locators.Input.inputBox)
            .findElement(Input.locators.Input.input);
        await input.sendKeys(Key.ESCAPE);
    }

    /**
     * Select (click) a quick pick option.
     * Search for the item can be done by its text, or index in the quick pick menu.
     * Note that scrolling does not affect the item's index, but it will
     * replace some items in the DOM (thus they become unreachable)
     * 
     * @param indexOrText index (number) or text (string) of the item to search by
     */
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

    /**
     * Find whether the input box has an active progress bar
     */
    abstract hasProgress(): Promise<boolean>

    /**
     * Retrieve the quick pick items currently available in the DOM
     * (visible in the quick pick menu)
     */
    abstract getQuickPicks(): Promise<QuickPickItem[]>
}

/**
 * Page object representing a quick pick option in the input box
 */
export class QuickPickItem extends AbstractElement {
    private index: number;

    constructor(index: number, input: Input) {
        let locator = Input.locators.Input.quickPickIndex(index);
        if (input instanceof QuickOpenBox) {
            locator = Input.locators.Input.quickPickPosition(index);
        }
        super(locator, input);
        this.index = index;
    }

    /**
     * Get the text of the quick pick item
     */
    async getText(): Promise<string> {
        return await this.findElement(Input.locators.Input.quickPickText).getText();
    }

    /**
     * Get the index of the quick pick item
     */
    getIndex(): number {
        return this.index;
    }

    /**
     * Select (click) the quick pick item
     */
    async select(): Promise<void> {
        await this.click();
    }
}