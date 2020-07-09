import { AbstractElement } from "../../AbstractElement";
import { Key } from "selenium-webdriver";
import { QuickOpenBox } from "../../..";

/**
 * Abstract page object for input fields
 */
export abstract class Input extends AbstractElement {

    /**
     * Get current text of the input field
     * @returns Promise resolving to text of the input field
     */
    async getText(): Promise<string> {
        const input = await this.findElement(Input.locators.Input.inputBox)
            .findElement(Input.locators.Input.input);
        return input.getAttribute('value');
    }

    /**
     * Set (by selecting all and typing) text in the input field
     * @param text text to set into the input field
     * @returns Promise resolving when the text is typed in
     */
    async setText(text: string): Promise<void> {
        const input = await this.findElement(Input.locators.Input.inputBox)
            .findElement(Input.locators.Input.input);
        await this.clear();
        await input.sendKeys(text);
    }

    /**
     * Get the placeholder text for the input field
     * @returns Promise resolving to input placeholder
     */
    async getPlaceHolder(): Promise<string> {
        return await this.findElement(Input.locators.Input.inputBox)
            .findElement(Input.locators.Input.input).getAttribute('placeholder');
    }

    /**
     * Confirm the input field by pressing Enter
     * @returns Promise resolving when the input is confirmed
     */
    async confirm(): Promise<void> {
        const input = await this.findElement(Input.locators.Input.inputBox)
            .findElement(Input.locators.Input.input);
        await input.sendKeys(Key.ENTER);
    }

    /**
     * Cancel the input field by pressing Escape
     * @returns Promise resolving when the input is cancelled
     */
    async cancel(): Promise<void> {
        const input = await this.findElement(Input.locators.Input.inputBox)
            .findElement(Input.locators.Input.input);
        await input.sendKeys(Key.ESCAPE);
    }

    /**
     * Clear the inpur field
     * @returns Promise resolving when the field is cleared
     */
    async clear(): Promise<void> {
        const input = await this.findElement(Input.locators.Input.inputBox)
            .findElement(Input.locators.Input.input);
        // VS Code 1.40 breaks the default clear method, use select all + back space instead
        await input.sendKeys(Key.END, Key.chord(Key.SHIFT, Key.HOME), Key.BACK_SPACE);
    }

    /**
     * Select (click) a quick pick option. Will scroll through the quick picks to find the item.
     * Search for the item can be done by its text, or index in the quick pick menu.
     * Note that scrolling does not affect the item's index, but it will
     * replace some items in the DOM (thus they become unreachable)
     * 
     * @param indexOrText index (number) or text (string) of the item to search by
     * @returns Promise resolving when the given quick pick is selected
     */
    async selectQuickPick(indexOrText: string | number): Promise<void> {
        const pick = await this.findQuickPick(indexOrText);
        if (pick) {
            await pick.select();
        } else {
            await this.resetPosition();
        }
    }

    /**
     * Scroll through the quick picks to find an item by the name or index
     * @param indexOrText index (number) or text (string) of the item to search by
     * @returns Promise resolvnig to QuickPickItem if found, to undefined otherwise
     */
    async findQuickPick(indexOrText: string | number): Promise<QuickPickItem | undefined> {
        const input = await this.findElement(Input.locators.Input.inputBox)
            .findElement(Input.locators.Input.input);
        const first = await this.findElements(Input.locators.Input.quickPickPosition(1));
        if (first.length < 1) {
            await this.resetPosition();
        }
        let endReached = false;

        while(!endReached) {
            const picks = await this.getQuickPicks();
            for (const pick of picks) {
                const lastRow = await this.findElements(Input.locators.DefaultTreeSection.lastRow);
                if (lastRow.length > 0) {
                    endReached = true;
                } else if (await pick.getAttribute('aria-posinset') === await pick.getAttribute('aria-setsize')) {
                    endReached = true;
                }
                if (typeof indexOrText === 'string') {
                    const text = await pick.getLabel();
                    if (text.indexOf(indexOrText) > -1) {
                        return pick;
                    }
                } else if (indexOrText === pick.getIndex()){
                    return pick;
                }
            }
            if (!endReached) {
                await input.sendKeys(Key.PAGE_DOWN);
            }
        }
        return undefined;
    }

    /**
     * Retrieve the title of an input box if it has one
     * @returns Promise resolving to title if it exists, to undefined otherwise
     */
    async getTitle(): Promise<string | undefined> {
        const titleBar = await this.findElements(Input.locators.Input.titleBar);
        if (titleBar.length > 0 && await titleBar[0].isDisplayed()) {
            return (await titleBar[0].findElement(Input.locators.Input.title)).getText();
        }
    }

    /**
     * Click on the back button if it exists
     * @returns Promise resolving to true if a button was clicked, to false otherwise
     */
    async back(): Promise<boolean> {
        const titleBar = await this.findElements(Input.locators.Input.titleBar);
        if (titleBar.length > 0 && await titleBar[0].isDisplayed()) {
            const backBtn = await titleBar[0].findElements(Input.locators.Input.backButton);
            if (backBtn.length > 0 && await backBtn[0].isEnabled()) {
                await backBtn[0].click();
                return true;
            }
        }
        return false;
    }

    /**
     * Find whether the input box has an active progress bar
     * @returns Promise resolving to true/false
     */
    abstract hasProgress(): Promise<boolean>

    /**
     * Retrieve the quick pick items currently available in the DOM
     * (visible in the quick pick menu)
     * @returns Promise resolving to array of QuickPickItem objects
     */
    abstract getQuickPicks(): Promise<QuickPickItem[]>

    private async resetPosition(): Promise<void> {
        const text = await this.getText();
        await this.clear();
        await this.setText(text);
    }
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
     * Get the label of the quick pick item
     */
    async getLabel(): Promise<string> {
        return this.findElement(Input.locators.Input.quickPickLabel).getText();
    }

    /**
     * Get the description of the quick pick item
     */
    async getDescription(): Promise<string | undefined> {
        try {
            return this.findElement(Input.locators.Input.quickPickDescription).getText();
        } catch (err) {
            return undefined;
        }
    }

    /**
     * Get the index of the quick pick item
     */
    getIndex(): number {
        return this.index;
    }

    /**
     * Select (click) the quick pick item
     * @returns Promise resolving when the item has been clicked
     */
    async select(): Promise<void> {
        await this.click();
    }
}