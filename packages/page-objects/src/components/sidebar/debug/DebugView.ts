import { SideBarView } from "../SideBarView";
import { DebugBreakpointSection } from "../tree/debug/DebugBreakpointSection";
import { DebugVariableSection } from "../tree/debug/DebugVariablesSection";

/**
 * Page object representing the Run/Debug view in the side bar
 */
export class DebugView extends SideBarView {
    
    /**
     * Get the title of the selected launch configuration
     * @returns Promise resolving to the title
     * @deprecated For VS Code 1.88+ this method won't be working any more
     */
    async getLaunchConfiguration(): Promise<string> {
        if(DebugView.versionInfo.version >= '1.87.0' && process.platform !== 'darwin') {
            throw Error(`DEPRECATED METHOD! The 'DebugView.getLaunchConfiguration' method is broken! Read more information in 'Known Issues > Limitations in testing with VS Code 1.87+' - https://github.com/microsoft/vscode/issues/206897.`);
        }
        const action = await this.getTitlePart().findElement(DebugView.locators.DebugView.launchCombo);
        const combo = await action.findElement(DebugView.locators.DebugView.launchSelect);
        return await combo.getAttribute('title');
    }

    /**
     * Get titles of all available launch configurations
     * @returns Promise resolving to list of titles
     */
    async getLaunchConfigurations(): Promise<string[]> {
        const action = await this.getTitlePart().findElement(DebugView.locators.DebugView.launchCombo);
        const combo = await action.findElement(DebugView.locators.DebugView.launchSelect);
        const configs: string[] = [];
        const options = await combo.findElements(DebugView.locators.DebugView.launchOption);

        for (const option of options) {
            if (await option.isEnabled()) {
                configs.push(await option.getAttribute('value'));
            }
        }

        return configs;
    }

    async getVariablesSection(): Promise<DebugVariableSection> {
        const content = this.getContent();
        return content.getSection(DebugVariableSection.locators.DebugVariableSection.predicate, DebugVariableSection);
    }

    /**
     * Get section which holds information about breakpoints.
     * @returns DebugBreakpointSection page object
     */
    async getBreakpointSection(): Promise<DebugBreakpointSection> {
        const content = this.getContent();
        return content.getSection(DebugBreakpointSection.locators.DebugBreakpointSection.predicate, DebugBreakpointSection);
    }

    /**
     * Select a given launch configuration
     * @param title title of the configuration to select
     */
    async selectLaunchConfiguration(title: string): Promise<void> {
        const action = await this.getTitlePart().findElement(DebugView.locators.DebugView.launchCombo);
        const combo = await action.findElement(DebugView.locators.DebugView.launchSelect);
        const option = await combo.findElement(DebugView.locators.DebugView.optionByName(title));
        await option.click();
    }

    /**
     * Start Debugging using the current launch configuration
     */
    async start(): Promise<void> {
        const action = await this.getTitlePart().findElement(DebugView.locators.DebugView.launchCombo);
        await action.findElement(DebugView.locators.DebugView.startButton).click();
    }
}