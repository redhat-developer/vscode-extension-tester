import { By, ChromiumWebDriver, until, WebElement } from "selenium-webdriver";
import { ContextMenu, ViewContent, ViewItem, waitForAttributeValue, WelcomeContentSection } from "../..";
import { AbstractElement } from "../AbstractElement";
import { ElementWithContexMenu } from "../ElementWithContextMenu";

export type ViewSectionConstructor<T extends ViewSection> = { new(rootElement: WebElement, tree: ViewContent): T };

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
     * Finds [Welcome Content](https://code.visualstudio.com/api/extension-guides/tree-view#welcome-content)
     * present in this ViewSection and returns it. If none is found, then `undefined` is returned
     *
     */
    public async findWelcomeContent(): Promise<WelcomeContentSection | undefined> {
        try {
            const res = await this.findElement(ViewSection.locators.ViewSection.welcomeContent);
            if (!await res.isDisplayed()) {
                return undefined;
            }
            return new WelcomeContentSection(res, this);
        } catch (_err) {
            return undefined;
        }
    }

    /**
     * Retrieve all items currently visible in the view section.
     * Note that any item currently beyond the visible list, i.e. not scrolled to, will not be retrieved.
     * @returns Promise resolving to array of ViewItem objects
     */
    abstract getVisibleItems(): Promise<ViewItem[]>;

    /**
     * Find an item in this view section by label. Does not perform recursive search through the whole tree.
     * Does however scroll through all the expanded content. Will find items beyond the current scroll range.
     * @param label Label of the item to search for.
     * @param maxLevel Limit how deep the algorithm should look into any expanded items, default unlimited (0)
     * @returns Promise resolving to ViewItem object is such item exists, undefined otherwise
     */
    abstract findItem(label: string, maxLevel?: number): Promise<ViewItem | undefined>;

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
    abstract openItem(...path: string[]): Promise<ViewItem[]>;

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
                actions.push(await new ViewPanelAction(element, this).wait());
            }
        }
        return actions;
    }

    /**
     * Retrieve an action button on the sections's header by its label
     * @param label label/title of the button
     * @returns ViewPanelAction object if found, undefined otherwise
     */
    async getAction(label: string): Promise<ViewPanelAction|undefined> {
        const actions = await this.getActions();
        for (const action of actions) {
            if (await action.getLabel() === label) {
                return action;
            }
        }
    }

    /**
     * Click on the More Actions... item if it exists
     * 
     * @returns ContextMenu page object if the action succeeds, undefined otherwise
     */
    async moreActions(): Promise<ContextMenu|undefined> {
        let more = await this.getAction('More Actions...');
        if (!more) {
            return undefined;
        }
        const section = this;
        const btn = new class extends ElementWithContexMenu {
            async openContextMenu() {
                await this.click();
                const shadowRootHost = await section.findElements(By.className('shadow-root-host'));
                if (shadowRootHost.length > 0) {
                    let shadowRoot;
                    const webdriverCapabilities = await (this.getDriver() as ChromiumWebDriver).getCapabilities();
                    const chromiumVersion = webdriverCapabilities.getBrowserVersion();
                    if (chromiumVersion && parseInt(chromiumVersion.split('.')[0]) >= 96) {
                        shadowRoot = await shadowRootHost[0].getShadowRoot();
                        return new ContextMenu(await shadowRoot.findElement(By.className('monaco-menu-container'))).wait();
                    } else {
                        shadowRoot = await this.getDriver().executeScript('return arguments[0].shadowRoot', shadowRootHost[0]) as WebElement;
                        return new ContextMenu(shadowRoot).wait();
                    }
                }
                return await super.openContextMenu();
            }
        }(more, this);
        return await btn.openContextMenu();
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
    constructor(element: WebElement, viewPart: ViewSection) {
        super(element, viewPart);
    }

    /**
     * Get label of the action button
     */
    async getLabel(): Promise<string> {
        return await this.getAttribute(ViewSection.locators.ViewSection.buttonLabel);
    }

    async wait(timeout: number = 1000): Promise<this> {
        await this.getDriver().wait(until.elementIsEnabled(this), timeout);
        return this;
    }
}