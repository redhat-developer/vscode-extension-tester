import { AbstractElement } from "../AbstractElement";
import { By, Key, until } from "selenium-webdriver";
import { TitleBar } from "../menu/TitleBar";
import { ProblemsView, OutputView, DebugConsoleView, TerminalView } from "../../../extester";

/**
 * Page object for the bottom view panel
 */
export class BottomBarPanel extends AbstractElement {
    constructor() {
        super(By.id('workbench.parts.panel'), By.className('monaco-workbench'));
    }

    /**
     * Open/Close the bottom bar panel
     * @param open true to open. false to close
     */
    async toggle(open: boolean): Promise<void> {
        const css = await this.getCssValue('height');
        if ((open && css === '0px') || !open && css !== '0px') {
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
        await this.openTab('Problems');
        return new ProblemsView(this);
    }

    /**
     * Open the Output view in the bottom panel
     */
    async openOutputView(): Promise<OutputView> {
        await this.openTab('Output');
        return new OutputView(this);
    }

    /**
     * Open the Debug Console view in the bottom panel
     */
    async openDebugConsoleView(): Promise<DebugConsoleView> {
        await this.openTab('Debug Console');
        return new DebugConsoleView(this);
    }

    /**
     * Open the Terminal view in the bottom panel
     */
    async openTerminalView(): Promise<TerminalView> {
        await this.openTab('Debug Console');
        return new TerminalView(this);
    }

    /**
     * Maximize the the bottom panel if not maximized
     */
    async maximize(): Promise<void> {
        await this.resize('Maximize Panel Size');
    }

    /**
     * Restore the the bottom panel if maximized
     */
    async restore(): Promise<void> {
        await this.resize('Restore Panel Size');
    }

    private async openTab(title: string) {
        await this.toggle(true);
        const tabContainer = await this.findElement(By.className('panel-switcher-container'));
        try {
            const tab = tabContainer.findElement(By.xpath(`.//li[starts-with(@title, '${title}')]`));
            await tab.click();
        } catch (err) {
            await new TitleBar().select('View', title);
        }
    }

    private async resize(label: string) {
        await this.toggle(true);
        try {
            const action = await this.findElement(By.className('actions-container'))
            .findElement(By.xpath(`.//a[@title='${label}']`));
            await action.click();
        } catch (err) {
            // the panel is already maximized 
        }
    }
}