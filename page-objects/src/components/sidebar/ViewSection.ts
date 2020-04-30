import { AbstractElement } from "../AbstractElement";
import { ViewContent, ViewItem, waitForAttributeValue } from "../..";
import { until, WebElement } from "selenium-webdriver";

/**
 * Page object representing a collapsible content section of the side bar view
 */
export abstract class ViewSection extends AbstractElement {

    constructor(panel: WebElement, content: ViewContent) {
        super(panel, content);
    }

    /**
     * Get the title of the section as string
     * @returns Promise resolving to section title
     */
    async getTitle(): Promise<string> {
        const title = await this.findElement(ViewSection.locators.ViewSection.title);
        return await title.getAttribute(ViewSection.locators.ViewSection.titleText);
    }

    /**
     * Expand the section if collapsed
     * @returns Promise resolving when the section is expanded
     */
    async expand(): Promise<void> {
        if (await this.isHeaderHidden()) {
            return;
        }
        if (!await this.isExpanded()) {
            const panel = await this.findElement(ViewSection.locators.ViewSection.header);
            await panel.click();
            await this.getDriver().wait(waitForAttributeValue(panel, ViewSection.locators.ViewSection.headerExpanded, 'true'), 1000);
        }
    }

    /**
     * Collapse the section if expanded
     * @returns Promise resolving when the section is collapsed
     */
    async collapse(): Promise<void> {
        if (await this.isHeaderHidden()) {
            return;
        }
        if (await this.isExpanded()) {
            const panel = await this.findElement(ViewSection.locators.ViewSection.header);
            await panel.click();
            await this.getDriver().wait(waitForAttributeValue(panel, ViewSection.locators.ViewSection.headerExpanded, 'false'), 1000);
        }
    }

    /**
     * Finds whether the section is expanded
     * @returns Promise resolving to true/false
     */
    async isExpanded(): Promise<boolean>  {
        const header = await this.findElement(ViewSection.locators.ViewSection.header);
        const expanded = await header.getAttribute(ViewSection.locators.ViewSection.headerExpanded);
        return expanded === 'true';
    }

    /**
     * Retrieve all items currently visible in the view section.
     * Note that any item currently beyond the visible list, i.e. not scrolled to, will not be retrieved.
     * @returns Promise resolving to array of ViewItem objects
     */
    abstract async getVisibleItems(): Promise<ViewItem[]>

    /**
     * Find an item in this view section by label. Does not perform recursive search through the whole tree.
     * Does however scroll through all the expanded content. Will find items beyond the current scroll range.
     * @param label Label of the item to search for.
     * @param maxLevel Limit how deep the algorithm should look into any expanded items, default unlimited (0)
     * @returns Promise resolving to ViewItem object is such item exists, undefined otherwise
     */
    abstract async findItem(label: string, maxLevel?: number): Promise<ViewItem | undefined>

    /**
     * Open an item with a given path represented by a sequence of labels
     * 
     * e.g to open 'file' inside 'folder', call
     * openItem('folder', 'file')
     * 
     * The first item is only searched for directly within the root element (depth 1).
     * The label sequence is handled in order. If a leaf item (a file for example) is found in the middle
     * of the sequence, the rest is ignored.
     * 
     * If the item structure is flat, use the item's title to search by.
     * 
     * @param path Sequence of labels that make up the path to a given item.
     * @returns Promise resolving to array of ViewItem objects representing the last item's children.
     * If the last item is a leaf, empty array is returned.
     */
    abstract async openItem(...path: string[]): Promise<ViewItem[] | void>

    /**
     * Retrieve the action buttons on the section's header
     * @returns Promise resolving to array of ViewPanelAction objects
     */
    async getActions(): Promise<ViewPanelAction[]> {
        const actions: ViewPanelAction[] = [];

        if (!await this.isHeaderHidden()) {
            const header = await this.findElement(ViewSection.locators.ViewSection.header);
            const act = await header.findElement(ViewSection.locators.ViewSection.actions);
            const elements = await act.findElements(ViewSection.locators.ViewSection.button);
    
            for (const element of elements) {
                actions.push(await new ViewPanelAction(await element.getAttribute(ViewSection.locators.ViewSection.buttonLabel), this).wait());
            }
        }
        return actions;
    }

    /**
     * Retrieve an action button on the sections's header by its label
     * @param label label/title of the button
     * @returns ViewPanelAction object
     */
    getAction(label: string): ViewPanelAction {
        return new ViewPanelAction(label, this);
    }

    private async isHeaderHidden(): Promise<boolean> {
        const header = await this.findElement(ViewSection.locators.ViewSection.header);
        return (await header.getAttribute('class')).indexOf('hidden') > -1;
    }
}

/**
 * Action button on the header of a view section
 */
export class ViewPanelAction extends AbstractElement {
    private label: string;

    constructor(label: string, viewPart: ViewSection) {
        super(ViewPanelAction.locators.ViewSection.actionConstructor(label), viewPart);
        this.label = label;
    }

    /**
     * Get label of the action button
     */
    getLabel(): string {
        return this.label;
    }

    async wait(timeout: number = 1000): Promise<this> {
        await this.getDriver().wait(until.elementIsEnabled(this), timeout);
        return this;
    }
}