import { AbstractElement } from "../AbstractElement";
import { SideBarView, ViewSection } from "../../../extester";
import { By } from "selenium-webdriver";

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
        return new ViewSection(title, this);
    }

    /**
     * Retrieves all the collapsible view content sections
     * @returns array of ViewSection objects
     */
    async getSections(): Promise<ViewSection[]> {
        const sections: ViewSection[] = [];
        const elements = await this.findElements(By.className('split-view-view'));
        for (const element of elements) {
            const title = await element.findElement(By.xpath(`.//h3[@class='title']`)).getAttribute('textContent');
            console.log(title)
            sections.push(new ViewSection(title, this));
        }
        return sections;
    }
}