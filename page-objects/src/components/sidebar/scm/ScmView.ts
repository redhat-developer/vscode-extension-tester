import { SideBarView } from "../SideBarView";
import { WebElement, Key, By } from "selenium-webdriver";
import { AbstractElement } from "../../AbstractElement";
import { ContextMenu } from "../../..";
import { ElementWithContexMenu } from "../../ElementWithContextMenu";

/**
 * Page object representing the Source Control view
 */
export class ScmView extends SideBarView {

    /**
     * Get SCM provider (repository) by title
     * @param title name of the repository
     * @returns promise resolving to ScmProvider object
     */
    async getProvider(title?: string): Promise<ScmProvider | undefined> {
        const providers = await this.getProviders();
        if (!title || providers.length === 1) {
            return providers[0];
        }
        const names = await Promise.all(providers.map(async item => item.getTitle()));
        const index = names.findIndex(name => name === title)

        return index > -1 ? providers[index] : undefined;
    }

    /**
     * Get all SCM providers
     * @returns promise resolving to ScmProvider array
     */
    async getProviders(): Promise<ScmProvider[]> {
        const headers = await this.findElements(ScmView.locators.ScmView.providerHeader);
        const sections = await Promise.all(headers.map(async header => header.findElement(ScmView.locators.ScmView.providerRelative)));
        return Promise.all(sections.map(async section => new ScmProvider(section, this)));
    }

    /**
     * Initialize repository in the current folder if no SCM provider is found
     * @returns true if the action was completed succesfully, false if a provider already exists
     */
    async initializeRepository(): Promise<boolean> {
        const buttons = await this.findElements(ScmView.locators.ScmView.initButton);
        if (buttons.length > 0) {
            await buttons[0].click();
            return true;
        }
        return false;
    }
}

/**
 * Page object representing a repository in the source control view
 * Maps roughly to a view section of the source control view
 */
export class ScmProvider extends AbstractElement {
    constructor(element: WebElement, view: ScmView) {
        super(element, view);
    }

    /**
     * Get title of the scm provider
     */
    async getTitle(): Promise<string> {
        return this.findElement(ScmProvider.locators.ScmView.providerTitle).getAttribute('innerHTML');
    }

    /**
     * Get type of the scm provider (e.g. Git)
     */
    async getType(): Promise<string> {
        return this.findElement(ScmProvider.locators.ScmView.providerType).getAttribute('innerHTML');
    }

    /**
     * Find an action button for the SCM provider by title and click it. (e.g 'Commit')
     * @param title Title of the action button to click
     * @returns true if the given action could be performed, false if the button doesn't exist
     */
    async takeAction(title: string): Promise<boolean> {
        const header = await this.findElement(ScmProvider.locators.ScmView.providerHeader);
        let actions: WebElement[] = [];
        if ((await header.getAttribute('class')).indexOf('hidden') > -1) {
            const view = this.enclosingItem as ScmView;
            actions = await view.getTitlePart().getActions();
        } else {
            await this.getDriver().actions().mouseMove(this).perform();
            actions = await header.findElements(ScmProvider.locators.ScmView.action);
        }
        const names = await Promise.all(actions.map(async action => action.getAttribute('title')));
        const index = names.findIndex(item => item === title);

        if (index > -1) {
            await actions[index].click();
            return true;
        }
        return false;
    }

    /**
     * Open a context menu using the 'More Actions...' button
     * @returns Promise resolving to a ContextMenu object
     */
    async openMoreActions(): Promise<ContextMenu> {
        const header = await this.findElement(ScmProvider.locators.ScmView.providerHeader);
        if ((await header.getAttribute('class')).indexOf('hidden') > -1) {
            return new MoreAction(this.enclosingItem as ScmView).openContextMenu();
        } else {
            await this.getDriver().actions().mouseMove(this).perform();
            return new MoreAction(this).openContextMenu();
        }
    }

    /**
     * Fill in the message field and send ctrl/cmd + enter to commit the changes
     * @param message the commit message to use
     * @returns promise resolving once the keypresses are sent
     */
    async commitChanges(message: string): Promise<void> {
        const input = await this.findElement(ScmProvider.locators.ScmView.inputField);
        await input.clear();
        await input.sendKeys(message);
        await input.sendKeys(Key.chord(ScmProvider.ctlKey, Key.ENTER));
    }

    /**
     * Get page objects for all tree items representing individual changes
     * @param staged when true, finds staged changes; otherwise finds unstaged changes
     * @returns promise resolving to ScmChange object array
     */
    async getChanges(staged: boolean = false): Promise<ScmChange[]> {
        const changes = await this.getChangeCount(staged);
        const label = staged ? 'STAGED CHANGES' : 'CHANGES';

        let elements: WebElement[] = [];
        if (changes > 0) {
            let i = -1;
            elements = await this.findElements(ScmProvider.locators.ScmView.changeItem);
            for (const [index, item] of elements.entries()) {
                const name = await item.findElement(ScmProvider.locators.ScmView.changeName);
                if (await name.getText() === label) {
                    i = index + 1;
                    break;
                }
            }
            if (i < 0) {
                return [];
            }
            elements = elements.slice(i, i + changes);
        }
        return Promise.all(elements.map(async element => new ScmChange(element, this).wait()));
    }

    /**
     * Get the number of changes for a given section
     * @param staged when true, counts the staged changes, unstaged otherwise
     * @returns promise resolving to number of changes in the given subsection
     */
    async getChangeCount(staged: boolean = false): Promise<number> {
        const locator = staged ? ScmProvider.locators.ScmView.stagedChanges : ScmProvider.locators.ScmView.changes;
        const rows = await this.findElements(locator);

        if (rows.length < 1) {
            return 0;
        }
        const count = await rows[0].findElement(ScmChange.locators.ScmView.changeCount);
        return +await count.getText();
    }
}

/**
 * Page object representing a SCM change tree item
 */
export class ScmChange extends ElementWithContexMenu {

    constructor(row: WebElement, provider: ScmProvider) {
        super(row, provider);
    }

    /**
     * Get label as a string
     */
    async getLabel(): Promise<string> {
        const label = await this.findElement(ScmChange.locators.ScmView.changeLabel);
        return label.getText();
    }

    /**
     * Get description as a string
     */
    async getDescription(): Promise<string> {
        const desc = await this.findElements(ScmChange.locators.ScmView.changeDesc);
        if (desc.length < 1) {
            return '';
        }
        return desc[0].getText();
    }

    /**
     * Get the status string (e.g. 'Modified')
     */
    async getStatus(): Promise<string> {
        const res = await this.findElement(ScmChange.locators.ScmView.resource);
        const status = await res.getAttribute('data-tooltip');
        
        if (status && status.length > 0) {
            return status;
        }
        return 'folder';
    }

    /**
     * Find if the item is expanded
     * @returns promise resolving to true if change is expanded, to false otherwise
     */
    async isExpanded(): Promise<boolean> {
        const twisties = await this.findElements(ScmChange.locators.ScmView.expand);
        if (twisties.length < 1) {
            return true;
        }
        return (await twisties[0].getAttribute('class')).indexOf('collapsed') < 0;
    }

    /**
     * Expand or collapse a change item if possible, only works for folders in hierarchical view mode
     * @param expand true to expand the item, false to collapse
     * @returns promise resolving to true if the item changed state, to false otherwise
     */
    async toggleExpand(expand: boolean): Promise<boolean> {
        if (await this.isExpanded() !== expand) {
            await this.click();
            return true;
        }
        return false;
    }

    /**
     * Find and click an action button available to a given change tree item
     * @param title title of the action button (e.g 'Stage Changes')
     * @returns promise resolving to true if the action was performed successfully,
     * false if the given button does not exist
     */
    async takeAction(title: string): Promise<boolean> {
        await this.getDriver().actions().mouseMove(this).perform();
        const actions = await this.findElements(ScmChange.locators.ScmView.action);
        const names = await Promise.all(actions.map(async action => action.getAttribute('title')));
        const index = names.findIndex(item => item === title);

        if (index > -1) {
            await actions[index].click();
            return true;
        }
        return false;
    }
}

export class MoreAction extends ElementWithContexMenu {
    constructor(scm: ScmProvider | ScmView) {
        super(MoreAction.locators.ScmView.more,scm);
    }

    async openContextMenu(): Promise<ContextMenu> {
        await this.click();
        const shadowRootHost = await this.enclosingItem.findElements(By.className('shadow-root-host'));

        if (shadowRootHost.length > 0) {
            if (await this.getAttribute('aria-expanded') !== 'true') {
                await this.click();
            }
            const shadowRoot = await this.getDriver().executeScript('return arguments[0].shadowRoot', shadowRootHost[0]) as WebElement;
            return new ContextMenu(shadowRoot).wait();
        }
        return super.openContextMenu();
    }
}