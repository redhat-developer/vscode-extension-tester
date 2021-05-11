import { By } from "selenium-webdriver";
import { SideBarView } from "../SideBarView";

/**
 * Page object representing the Run/Debug view in the side bar
 */
export class DebugView extends SideBarView {
    
    /**
     * Get the title of the selected launch configuration
     * @returns Promise resolving to the title
     */
    async getLaunchConfiguration(): Promise<string> {
        const action = await this.getTitlePart().findElement(By.className('start-debug-action-item'));
        const combo = await action.findElement(By.css('select'));
        return combo.getAttribute('title');
    }

    /**
     * Get titles of all available launch configurations
     * @returns Promise resolving to list of titles
     */
    async getLaunchConfigurations(): Promise<string[]> {
        const action = await this.getTitlePart().findElement(By.className('start-debug-action-item'));
        const combo = await action.findElement(By.css('select'));
        const configs: string[] = [];
        const options = await combo.findElements(By.css('option'));

        for (const option of options) {
            if (await option.isEnabled()) {
                configs.push(await option.getAttribute('value'));
            }
        }

        return configs;
    }

    /**
     * Select a given launch configuration
     * @param title title of the configuration to select
     */
    async selectLaunchConfiguration(title: string): Promise<void> {
        const action = await this.getTitlePart().findElement(By.className('start-debug-action-item'));
        const combo = await action.findElement(By.css('select'));
        const option = await combo.findElement(By.xpath(`.//option[@value='${title}']`));
        await option.click();
    }

    /**
     * Start Debugging using the current launch configuration
     */
    async start(): Promise<void> {
        const action = await this.getTitlePart().findElement(By.className('start-debug-action-item'));
        await action.findElement(By.className('codicon-debug-start')).click();
    }
}