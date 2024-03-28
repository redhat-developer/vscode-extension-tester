import { Key } from 'selenium-webdriver';
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
        if(ChannelView.versionInfo.version >= '1.87.0' && process.platform !== 'darwin') {
            throw Error(`The 'ChannelView.getCurrentChannel' method is broken! Read more information in 'Known Issues > Limitations in testing with VS Code 1.87+' - https://github.com/microsoft/vscode/issues/206897.`);
        }
        const combo = await this.enclosingItem.findElement(ChannelView.locators.BottomBarViews.channelCombo);
        return await combo.getAttribute('title');
    }

    /**
     * Select a channel using the selector combo
     * @param name name of the channel to open
     */
    async selectChannel(name: string): Promise<void> {
        const combo = await this.enclosingItem.findElement(ChannelView.locators.BottomBarViews.channelCombo);
        const option = await combo.findElement(ChannelView.locators.OutputView.optionByName(name));
        await option.click();
    }
}

/**
 * View with channel selection and text area
 */
export abstract class TextView extends ChannelView {
    declare protected actionsLabel: string;

    /**
     * Get all text from the currently open channel
     * @returns Promise resolving to the view's text
     */
    async getText(): Promise<string> {
        const clipboard = (await import('clipboardy')).default;
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
