import { AbstractElement } from "../AbstractElement";
import { ViewContent, ViewItem, waitForAttributeValue } from "../../../extester";
import { By } from "selenium-webdriver";

/**
 * Page object representing a collapsible content section of the side bar view
 */
export abstract class ViewSection extends AbstractElement {
    private title: string;

    constructor(title: string, content: ViewContent) {
        super(By.xpath(`.//div[@class='split-view-view' and translate(div/div/h3/text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz')='${title.toLowerCase()}']`), content);
        this.title = title;
    }

    getTitle(): string {
        return this.title;
    }

    /**
     * Expand the section if collapsed
     */
    async expand(): Promise<void> {
        if (await this.isHeaderHidden()) {
            return;
        }
        if (!await this.isExpanded()) {
            const panel = await this.findElement(By.className('panel-header'));
            await panel.click();
            await this.getDriver().wait(waitForAttributeValue(panel, 'aria-expanded', 'true'), 1000);
        }
    }

    /**
     * Collapse the section if expanded
     */
    async collapse(): Promise<void> {
        if (await this.isHeaderHidden()) {
            return;
        }
        if (await this.isExpanded()) {
            const panel = await this.findElement(By.className('panel-header'));
            await panel.click();
            await this.getDriver().wait(waitForAttributeValue(panel, 'aria-expanded', 'false'), 1000);
        }
    }

    /**
     * Finds whether the section is expanded
     */
    async isExpanded(): Promise<boolean>  {
        const header = await this.findElement(By.className('panel-header'));
        const expanded = await header.getAttribute('aria-expanded');
        return expanded === 'true';
    }

    /**
     * Retrieve all items currently visible in the view section.
     * Note that any item currently beyond the visible list, i.e. not scrolled to, will not be retrieved.
     * @returns array of ViewItem objects
     */
    abstract async getVisibleItems(): Promise<ViewItem[]>

    /**
     * Find an item in this view section by label. Does not perform recursive search through the whole tree.
     * Does however scroll through all the expanded content. Will find items beyond the current scroll range.
     * @param label Label of the item to search for.
     * @param maxLevel Limit how deep the algorithm should look into any expanded items, default unlimited (0)
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
     * @param path Sequence of labels that make up the path to a given item.
     * @returns array of ViewItem objects representing the last item's children.
     * If the last item is a leaf, empty array is returned.
     */
    async openItem(...path: string[]): Promise<ViewItem[]> {
        let currentItem = await this.findItem(path[0], 1);
        let items: ViewItem[] = [];

        for (let i = 0; i < path.length; i++) {
            if (!currentItem) {
                throw new Error(`Item ${path[i]} not found`);
            }
            items = await currentItem.getChildren();
            if (items.length < 1) {
                return items;
            }
            if (i + 1 < path.length) {
                currentItem = items.find((value) => {
                    return value.getLabel() === path[i + 1];
                });
            }
        }
        return items;
    }

    /**
     * Retrieve the action buttons on the section's header
     * @returns array of ViewPanelAction objects
     */
    async getActions(): Promise<ViewPanelAction[]> {
        const actions: ViewPanelAction[] = [];

        if (!await this.isHeaderHidden()) {
            const header = await this.findElement(By.className('panel-header'));
            const act = await header.findElement(By.className('actions'));
            const elements = await act.findElements(By.xpath(`.//a[@role='button']`));
    
            for (const element of elements) {
                actions.push(await new ViewPanelAction(await element.getAttribute('title'), this).wait());
            }
        }
        return actions;
    }

    /**
     * Retrieve an action button on the sections's header by its label
     * @param label label/title of the button
     */
    getAction(label: string): ViewPanelAction {
        return new ViewPanelAction(label, this);
    }

    private async isHeaderHidden(): Promise<boolean> {
        const header = await this.findElement(By.className('panel-header'));
        return (await header.getAttribute('class')).indexOf('hidden') > -1;
    }
}

/**
 * Action button on the header of a view section
 */
export class ViewPanelAction extends AbstractElement {
    private label: string;

    constructor(label: string, viewPart: ViewSection) {
        super(By.xpath(`.//a[contains(@class, 'action-label') and @role='button' and @title='${label}]'`), viewPart);
        this.label = label;
    }

    /**
     * Get label of the action button
     */
    getLabel(): string {
        return this.label;
    }
}