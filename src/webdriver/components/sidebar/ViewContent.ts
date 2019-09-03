import { AbstractElement } from "../AbstractElement";
import { SideBarView, ViewSection } from "../../../extester";
import { By, WebElement } from "selenium-webdriver";
import { DefaultTreeSection } from "./tree/default/DefaultTreeSection";
import { CustomTreeSection } from "./tree/custom/CustomTreeSection";
import { ExtensionsViewSection } from "./extensions/ExtensionsViewSection";

/**
 * Page object representing the view container of a side bar view
 */
export class ViewContent extends AbstractElement {
    constructor(view: SideBarView = new SideBarView()) {
        super(By.className('content'), view);
    }

    /**
     * Finds whether a progress bar is active at the top of the view
     */
    async hasProgress(): Promise<boolean> {
        const progress = await this.findElement(By.className('monaco-progress-container'));
        const hidden = await progress.getAttribute('aria-hidden');
        if (hidden === 'true') {
            return false;
        }
        return true;
    }

    /**
     * Retrieves a collapsible view content section by its title
     * @param title Title of the section
     * @returns a ViewSection object
     */
    async getSection(title: string): Promise<ViewSection> {
        const elements = await this.findElements(By.className('split-view-view'));
        let panel!: WebElement;

        for (const element of elements) {
            const currentTitle = await element.findElement(By.xpath(`.//h3[@class='title']`));
            if (await currentTitle.getAttribute('textContent') === title) {
                panel = element;
                break;
            }
        }
        if (!panel) {
            throw new Error(`No section with title '${title}' found`);
        }
        return await this.createSection(panel);
    }

    /**
     * Retrieves all the collapsible view content sections
     * @returns array of ViewSection objects
     */
    async getSections(): Promise<ViewSection[]> {
        const sections: ViewSection[] = [];
        const elements = await this.findElements(By.className('split-view-view'));
        for (const element of elements) {
            let section = await this.createSection(element);
            sections.push(await section.wait());
        }
        return sections;
    }

    private async createSection(panel: WebElement): Promise<ViewSection> {
        let section: ViewSection = new DefaultTreeSection(panel, this);
        try {
            await section.findElement(By.className('explorer-folders-view'));
        } catch (err) {
            try {
                await section.findElement(By.className('extensions-list'));
                section = new ExtensionsViewSection(panel, this);
            } catch (err) {
                section = new CustomTreeSection(panel, this);
            }
        }
        return section;
    }
}