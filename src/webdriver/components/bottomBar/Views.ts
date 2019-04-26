import { By, Key } from "selenium-webdriver";
import { BottomBarPanel } from "../../../extester";
import { TextView, ChannelView } from "./AbstractViews";
import { AbstractElement } from "../AbstractElement";
import * as clipboard from 'clipboardy';

/**
 * Output view of the bottom panel
 */
export class OutputView extends TextView {
    constructor(panel: BottomBarPanel = new BottomBarPanel()) {
        super(By.id('workbench.panel.output'), panel);
        this.actionsLabel = 'Output actions';
    }
}

/**
 * Debug Console view on the bottom panel
 * Functionality TBD on request
 */
export class DebugConsoleView extends AbstractElement {
    constructor(panel: BottomBarPanel = new BottomBarPanel()) {
        super(By.id('workbench.panel.repl'), panel);
    }
}

/**
 * Terminal view on the bottom panel
 */
export class TerminalView extends ChannelView {
    constructor(panel: BottomBarPanel = new BottomBarPanel()) {
        super(By.id('workbench.panel.terminal'), panel);
        this.actionsLabel = 'Terminal actions';
    }

    /**
     * Execute command in the internal terminal
     * @param command text of the command
     */
    async executeCommand(command: string): Promise<void> {
        const input = await this.findElement(By.className('xterm-helper-textarea'));
        await input.sendKeys(command, Key.ENTER);
    }
    
    /**
     * Get all text from the internal terminal
     * Beware, no formatting.
     */
    async getText(): Promise<string> {
        const menu = await this.openContextMenu();
        await menu.select('Select All');
        await (await this.openContextMenu()).select('Copy');
        return clipboard.readSync();
    }

    /**
     * Destroy the currently open terminal
     */
    async killTerminal(): Promise<void> {
        await this.enclosingItem.findElement(By.xpath(`.//ul[@aria-label='${this.actionsLabel}']`))
            .findElement(By.xpath(`.//a[@title='Kill Terminal']`)).click();
    }

    /**
     * Initiate new terminal creation
     */
    async newTerminal(): Promise<void> {
        await this.enclosingItem.findElement(By.xpath(`.//ul[@aria-label='${this.actionsLabel}']`))
            .findElement(By.xpath(`.//a[starts-with(@title,'New Terminal')]`)).click();
    }
}