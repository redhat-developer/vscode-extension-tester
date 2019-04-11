import { By } from "selenium-webdriver";
import { BottomBarPanel } from "../../../extester";
import { TextView, ChannelView } from "./AbstractViews";

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
 */
export class DebugConsoleView extends TextView {
    constructor(panel: BottomBarPanel = new BottomBarPanel()) {
        super(By.id('workbench.panel.repl'), panel);
        this.actionsLabel = 'Debug Console actions';
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