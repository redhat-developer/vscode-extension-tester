import { SideBarView } from "../SideBarView";
import { DebugVariableSection } from "../tree/debug/DebugVariablesSection";

/**
 * Page object representing the Run/Debug view in the side bar
 */
export class DebugView extends SideBarView {
    
    /**
     * Get the title of the selected launch configuration
     * @returns Promise resolving to the title
     */
    async getLaunchConfiguration(): Promise<string> {
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