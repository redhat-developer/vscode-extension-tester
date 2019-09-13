import { AbstractElement } from "../AbstractElement";
import { Key, until } from "selenium-webdriver";
import { TitleBar } from "../menu/TitleBar";
import { ProblemsView, OutputView, DebugConsoleView, TerminalView } from "../../../extester";

/**
 * Page object for the bottom view panel
 */
export class BottomBarPanel extends AbstractElement {
    constructor() {
        super(BottomBarPanel.locators.BottomBarPanel.constructor, BottomBarPanel.locators.Workbench.constructor);
    }

    /**
     * Open/Close the bottom bar panel
     * @param open true to open. false to close
     */
    async toggle(open: boolean): Promise<void> {
        const height = (await this.getSize()).height;
        if ((open && height === 0) || !open && height > 0) {
            await this.getDriver().actions().sendKeys(Key.chord(BottomBarPanel.ctlKey, 'j')).perform();
            if (open) {
                await this.wait();
            } else {
                await this.getDriver().wait(until.elementIsNotVisible(this));
            }
        }
    }

    /**
     * Open the Problems view in the bottom panel
     */
    async openProblemsView(): Promise<ProblemsView> {
        await this.openTab(BottomBarPanel.locators.BottomBarPanel.problemsTab);
        return new ProblemsView(this).wait();
    }

    /**
     * Open the Output view in the bottom panel
     */
    async openOutputView(): Promise<OutputView> {
        await this.openTab(BottomBarPanel.locators.BottomBarPanel.outputTab);
        return new OutputView(this).wait();
    }

    /**
     * Open the Debug Console view in the bottom panel
     */
    async openDebugConsoleView(): Promise<DebugConsoleView> {
        await this.openTab(BottomBarPanel.locators.BottomBarPanel.debugTab);
        return new DebugConsoleView(this).wait();
    }

    /**
     * Open the Terminal view in the bottom panel
     */
    async openTerminalView(): Promise<TerminalView> {
        await this.openTab(BottomBarPanel.locators.BottomBarPanel.terminalTab);
        return new TerminalView(this).wait();
    }

    /**
     * Maximize the the bottom panel if not maximized
     */
    async maximize(): Promise<void> {
        await this.resize(BottomBarPanel.locators.BottomBarPanel.maximize);
    }

    /**
     * Restore the the bottom panel if maximized
     */
    async restore(): Promise<void> {
        await this.resize(BottomBarPanel.locators.BottomBarPanel.restore);
    }

    private async openTab(title: string) {
        await this.toggle(true);
        const tabContainer = await this.findElement(BottomBarPanel.locators.BottomBarPanel.tabContainer);
        try {
            const tab = tabContainer.findElement(BottomBarPanel.locators.BottomBarPanel.tab(title));
            await tab.click();
        } catch (err) {
            await new TitleBar().select('View', title);
        }
    }

    private async resize(label: string) {
        await this.toggle(true);
        try {
            const action = await this.findElement(BottomBarPanel.locators.BottomBarPanel.actions)
                .findElement(BottomBarPanel.locators.BottomBarPanel.action(label));
            await action.click();
        } catch (err) {
            // the panel is already maximized
        }
    }
}