import { Key } from "selenium-webdriver";
import { BottomBarPanel, ContentAssist, Workbench } from "../..";
import { TextView, ChannelView } from "./AbstractViews";
import * as clipboard from 'clipboardy';
import { ElementWithContexMenu } from "../ElementWithContextMenu";

/**
 * Output view of the bottom panel
 */
export class OutputView extends TextView {
    constructor(panel: BottomBarPanel = new BottomBarPanel()) {
        super(OutputView.locators.OutputView.constructor, panel);
        this.actionsLabel = OutputView.locators.OutputView.actionsLabel;
    }
}

/**
 * Debug Console view on the bottom panel
 * Most functionality will only be available when a debug session is running
 */
export class DebugConsoleView extends ElementWithContexMenu {
    constructor(panel: BottomBarPanel = new BottomBarPanel()) {
        super(DebugConsoleView.locators.DebugConsoleView.constructor, panel);
    }

    /**
     * Get all text from the debug console
     */
    async getText(): Promise<string> {
        const menu = await this.openContextMenu();
        await menu.select('Copy All');
        const text = await clipboard.read();
        await clipboard.write('');
        return text;
    }

    /**
     * Clear the console of all text
     */
    async clearText(): Promise<void> {
        const menu = await this.openContextMenu();
        await menu.select('Clear Console');
    }

    /**
     * Type an expression into the debug console text area
     * @param expression expression in form of a string
     */
    async setExpression(expression: string): Promise<void> {
        const textarea = await this.findElement(DebugConsoleView.locators.BottomBarViews.textArea);
        await textarea.clear();
        await textarea.sendKeys(expression);
    } 

    /**
     * Evaluate an expression:
     *  - if no argument is supplied, evaluate the current expression present in debug console text area
     *  - if a string argument is supplied, replace the current expression with the `expression` argument and evaluate
     * 
     * @param expression expression to evaluate. To use existing contents of the debug console text area instead, don't define this argument
     */
    async evaluateExpression(expression?: string): Promise<void> {
        const textarea = await this.findElement(DebugConsoleView.locators.BottomBarViews.textArea);
        if (expression) {
            await this.setExpression(expression);
        }
        await textarea.sendKeys(Key.ENTER);
    }
    
    /**
     * Create a content assist page object
     * @returns promise resolving to ContentAssist object
     */
    async getContentAssist(): Promise<ContentAssist> {
        return new ContentAssist(this).wait();
    }
}

/**
 * Terminal view on the bottom panel
 */
export class TerminalView extends ChannelView {
    constructor(panel: BottomBarPanel = new BottomBarPanel()) {
        super(TerminalView.locators.TerminalView.constructor, panel);
        this.actionsLabel = TerminalView.locators.TerminalView.actionsLabel;
    }

    /**
     * Execute command in the internal terminal
     * @param command text of the command
     * @returns Promise resolving when the command is filled in and enter is pressed
     */
    async executeCommand(command: string): Promise<void> {
        const input = await this.findElement(TerminalView.locators.TerminalView.textArea);
        await input.sendKeys(command, Key.ENTER);
    }
    
    /**
     * Get all text from the internal terminal
     * Beware, no formatting.
     * @returns Promise resolving to all terminal text
     */
    async getText(): Promise<string> {
        const workbench = new Workbench();
        await workbench.executeCommand('terminal select all');
        await workbench.getDriver().sleep(500);
        await workbench.executeCommand('terminal copy selection');
        await workbench.getDriver().sleep(500);
        const text = clipboard.readSync();
        clipboard.writeSync('');
        return text;
    }

    /**
     * Destroy the currently open terminal
     * @returns Promise resolving when Kill Terminal button is pressed
     */
    async killTerminal(): Promise<void> {
        await this.enclosingItem.findElement(TerminalView.locators.BottomBarViews.actionsContainer(this.actionsLabel))
            .findElement(TerminalView.locators.TerminalView.killTerminal).click();
    }

    /**
     * Initiate new terminal creation
     * @returns Promise resolving when New Terminal button is pressed
     */
    async newTerminal(): Promise<void> {
        await this.enclosingItem.findElement(TerminalView.locators.BottomBarViews.actionsContainer(this.actionsLabel))
            .findElement(TerminalView.locators.TerminalView.newTerminal).click();
    }
}