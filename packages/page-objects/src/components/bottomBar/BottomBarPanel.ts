import { AbstractElement } from "../AbstractElement";
import { By, until, WebElement } from "selenium-webdriver";
import { ProblemsView, OutputView, DebugConsoleView, TerminalView, EditorView, Workbench } from "../..";

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
     * @returns Promise resolving when the view visibility is toggled
     */
    async toggle(open: boolean): Promise<void> {
        try {
            const tab = await new EditorView().getActiveTab();
            await tab?.click();
        } catch (err) {
            // ignore and move on
        }
        const height = (await this.getRect()).height;
        if ((open && height === 0) || !open && height > 0) {
            if (open) {
                await this.getDriver().actions().clear();
                await this.getDriver().actions().keyDown(BottomBarPanel.ctlKey).sendKeys('j').perform();
                await this.wait();
            } else {
                await this.closePanel();
                await this.getDriver().wait(until.elementIsNotVisible(this));
            }
        }
    }

    /**
     * Open the Problems view in the bottom panel
     * @returns Promise resolving to a ProblemsView object
     */
    async openProblemsView(): Promise<ProblemsView> {
        await this.openTab(BottomBarPanel.locators.BottomBarPanel.problemsTab);
        return new ProblemsView(this).wait();
    }

    /**
     * Open the Output view in the bottom panel
     * @returns Promise resolving to OutputView object
     */
    async openOutputView(): Promise<OutputView> {
        await this.openTab(BottomBarPanel.locators.BottomBarPanel.outputTab);
        return new OutputView(this).wait();
    }

    /**
     * Open the Debug Console view in the bottom panel
     * @returns Promise resolving to DebugConsoleView object
     */
    async openDebugConsoleView(): Promise<DebugConsoleView> {
        await this.openTab(BottomBarPanel.locators.BottomBarPanel.debugTab);
        return new DebugConsoleView(this).wait();
    }

    /**
     * Open the Terminal view in the bottom panel
     * @returns Promise resolving to TerminalView object
     */
    async openTerminalView(): Promise<TerminalView> {
        await this.openTab(BottomBarPanel.locators.BottomBarPanel.terminalTab);
        return new TerminalView(this).wait();
    }

    /**
     * Maximize the the bottom panel if not maximized
     * @returns Promise resolving when the maximize button is pressed
     */
    async maximize(): Promise<void> {
        await this.resize(BottomBarPanel.locators.BottomBarPanel.maximize);
    }

    /**
     * Restore the the bottom panel if maximized
     * @returns Promise resolving when the restore button is pressed
     */
    async restore(): Promise<void> {
        await this.resize(BottomBarPanel.locators.BottomBarPanel.restore);
    }

    private async openTab(title: string) {
        await this.toggle(true);
        const tabContainer = await this.findElement(BottomBarPanel.locators.BottomBarPanel.tabContainer);
        try {
            const tabs = await tabContainer.findElements(BottomBarPanel.locators.BottomBarPanel.tab(title));
            if (tabs.length > 0) {
                await tabs[0].click();
            } else {
                const label = await tabContainer.findElement(By.xpath(`.//a[starts-with(@aria-label, '${title}')]`));
                await label.click();
            }
        } catch (err) {
            await new Workbench().executeCommand(`${title}: Focus on ${title} View`);
        }
    }

    private async resize(label: string) {
        await this.toggle(true);
        let action!: WebElement;
        try {
            action = await this.findElement(BottomBarPanel.locators.BottomBarPanel.globalActions)
                .findElement(BottomBarPanel.locators.BottomBarPanel.action(label));
        } catch (err) {
            // the panel is already maximized
        }
        if (action) {
            await action.click();
        }
    }

    public async closePanel() {
        const closeButton = await this.findElement(BottomBarPanel.locators.BottomBarPanel.closeAction);
        await closeButton.click();
    }
}