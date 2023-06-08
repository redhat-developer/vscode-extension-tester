import { Key, WebElement } from 'selenium-webdriver';
import * as clipboard from 'clipboardy';
import { ElementWithContexMenu } from "../ElementWithContextMenu";

/**
 * View with channel selector
 */
export abstract class ChannelView extends ElementWithContexMenu {
    protected actionsLabel!: string;

    /**
    * Get names of all selectable channels
    * @returns Promise resolving to array of strings - channel names
    */
    async getChannelNames(): Promise<string[]> {
        const names: string[] = [];
        const elements = await (await this.enclosingItem.findElement(ChannelView.locators.BottomBarViews.actionsContainer(this.actionsLabel)))
            .findElements(ChannelView.locators.BottomBarViews.channelOption);

        await Promise.all(elements.map(async element => { 
            const disabled = await element.getAttribute('disabled');
            if (!disabled) {
                names.push(await element.getAttribute('value'));
            }
        }));

        return names;
    }

    /**
     * Get name of the current channel
     * @returns Promise resolving to the current channel name
     */
    async getCurrentChannel(): Promise<string> {
        const combo = await this.enclosingItem.findElement(ChannelView.locators.BottomBarViews.channelCombo);
        return await combo.getAttribute('title');
    }

    /**
     * Select a channel using the selector combo
     * @param name name of the channel to open
     */
    async selectChannel(name: string): Promise<void> {
        const rows = await this.getOptions();
        for (let i = 0; i < rows.length; i++) {
            if ((await rows[i].getAttribute('class')).indexOf('disabled') < 0) {
                const text = await (await rows[i].findElement(ChannelView.locators.BottomBarViews.channelText)).getText();
                if (name === text) {
                    await rows[i].click();
                    await new Promise(res => setTimeout(res, 500));
                    return;
                }
            }
        }
        throw new Error(`Channel ${name} not found`);
    }

    private async getOptions(): Promise<WebElement[]> {
        const combo = await this.enclosingItem.findElement(ChannelView.locators.BottomBarViews.channelCombo);
        const workbench = await this.getDriver().findElement(ChannelView.locators.Workbench.constructor);
        const menus = await workbench.findElements(ChannelView.locators.ContextMenu.contextView);
        let menu!: WebElement;

        if (menus.length < 1) {
            await combo.click();
            await this.getDriver().sleep(500);
            menu = await workbench.findElement(ChannelView.locators.ContextMenu.contextView);
            return await menu.findElements(ChannelView.locators.BottomBarViews.channelRow);
        } else if (await menus[0].isDisplayed()) {
            await combo.click();
            await this.getDriver().sleep(500);
        }
        await combo.click();
        await this.getDriver().sleep(500);
        menu = await workbench.findElement(ChannelView.locators.ContextMenu.contextView);
        if (!await menu.isDisplayed()) {
            await combo.click();
            await this.getDriver().sleep(500);
        }
        return await menu.findElements(ChannelView.locators.BottomBarViews.channelRow);
    }
}

/**
 * View with channel selection and text area
 */
export abstract class TextView extends ChannelView {
    protected actionsLabel!: string;

    /**
     * Get all text from the currently open channel
     * @returns Promise resolving to the view's text
     */
    async getText(): Promise<string> {
        let originalClipboard = '';
        try {
            originalClipboard = clipboard.readSync();
        } catch (error) {
            // workaround issue https://github.com/redhat-developer/vscode-extension-tester/issues/835
            // do not fail if clipboard is empty
        }
        let textarea = await this.findElement(ChannelView.locators.BottomBarViews.textArea);
        await textarea.sendKeys(Key.chord(TextView.ctlKey, 'a'));
        await textarea.sendKeys(Key.chord(TextView.ctlKey, 'c'));
        const text = clipboard.readSync();
        // workaround as we are getting "element click intercepted" during the send keys actions.
        // await textarea.click();
        if(originalClipboard.length > 0) {
            clipboard.writeSync(originalClipboard);
        }
        return text;
    }

    /**
     * Clear the text in the current channel
     * @returns Promise resolving when the clear text button is pressed
     */
    async clearText(): Promise<void> {
        await this.enclosingItem.findElement(ChannelView.locators.BottomBarViews.actionsContainer(this.actionsLabel))
            .findElement(ChannelView.locators.BottomBarViews.clearText).click();
    }
}
