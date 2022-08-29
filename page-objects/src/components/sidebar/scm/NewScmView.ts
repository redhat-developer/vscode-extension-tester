import { ScmView, ScmProvider, MoreAction, ScmChange } from "./ScmView";
import { WebElement, Key } from "selenium-webdriver";
import { ContextMenu } from "../../menu/ContextMenu";
import { ElementWithContexMenu } from "../../ElementWithContextMenu";
import { TitleActionButton } from "../ViewTitlePart";

/**
 * New SCM view for code 1.47 onwards
 */
export class NewScmView extends ScmView {

    async getProviders(): Promise<ScmProvider[]> {
        const inputs = await this.findElements(NewScmView.locators.ScmView.inputField);
        if (inputs.length < 1) {
            return [];
        }

        const providers = await this.findElements(NewScmView.locators.ScmView.multiScmProvider);
        if (inputs.length === 1 && providers.length < 1) {
            const element = await this.findElement(NewScmView.locators.ScmView.singleScmProvider);
            return [await new SingleScmProvider(element, this).wait()];
        }

        const elements = await this.findElements(NewScmView.locators.ScmView.multiProviderItem);
        return Promise.all(elements.map(async element => new MultiScmProvider(element, this).wait()));
    }
}

/**
 * Implementation for a single SCM provider
 */
export class SingleScmProvider extends ScmProvider {

    /**
     * There is no title available for a single provider
     */
    async getTitle(): Promise<string> {
        return '';
    }

    /**
     * No title available for single provider
     */
    async getType(): Promise<string> {
        return '';
    }

    async takeAction(title: string): Promise<boolean> {
        const view = this.enclosingItem as NewScmView;
        const titlePart = view.getTitlePart();
        const elements = await titlePart.findElements(ScmView.locators.ScmView.action);
        const buttons: TitleActionButton[] = [];
        for (const element of elements) {
            const title = await element.getAttribute('title');
            buttons.push(await new TitleActionButton(ScmView.locators.ScmView.actionConstructor(title), title, titlePart).wait());
        }
        const names = await Promise.all(buttons.map(async button => button.getTitle()));
        const index = names.findIndex(name => name === title)
        if (index > -1) {
            await buttons[index].click();
            return true;
        }
        return false;
    }

    async openMoreActions(): Promise<ContextMenu> {
        const view = this.enclosingItem as NewScmView;
        return new MoreAction(view).openContextMenu();
    }

    async getChanges(staged: boolean = false): Promise<ScmChange[]> {
        const count = await this.getChangeCount(staged);
        const elements: WebElement[] = [];

        if (count > 0) {
            const locator = staged ? ScmProvider.locators.ScmView.stagedChanges : ScmProvider.locators.ScmView.changes;
            const header = await this.findElement(locator);
            const startIndex = +await header.getAttribute('data-index');
            const depth = +await header.getAttribute('aria-level') + 1;

            const items = await this.findElements(NewScmView.locators.ScmView.itemLevel(depth));
            for (const item of items) {
                const index = +await item.getAttribute('data-index');
                if (index > startIndex && index <= startIndex + count) {
                    elements.push(item);
                }
            }
        }
        return Promise.all(elements.map(async element => new ScmChange(element, this).wait()));
    }
}

/**
 * Implementation of an SCM provider when multiple providers are available
 */
export class MultiScmProvider extends ScmProvider {

    async takeAction(title: string): Promise<boolean> {
        const actions = await this.findElements(ScmProvider.locators.ScmView.action);
        const names = await Promise.all(actions.map(async action => action.getAttribute('title')));
        const index = names.findIndex(item => item === title);
        console.log(`MultiSCMProvider takeAction results: ${names}`);

        if (index > -1) {
            await actions[index].click();
            return true;
        }
        return false;
    }

    async openMoreActions(): Promise<ContextMenu> {
        return new MultiMoreAction(this).openContextMenu();
    }

    async commitChanges(message: string): Promise<void> {
        const index = +await this.getAttribute('data-index') + 1;
        const input = await this.enclosingItem.findElement(NewScmView.locators.ScmView.itemIndex(index));
        await input.clear();
        await input.sendKeys(message);
        await input.sendKeys(Key.chord(ScmProvider.ctlKey, Key.ENTER));
    }

    async getChanges(staged: boolean = false): Promise<ScmChange[]> {
        const count = await this.getChangeCount(staged);
        const elements: WebElement[] = [];

        if (count > 0) {
            const index = +await this.getAttribute('data-index');
            const locator = staged ? ScmProvider.locators.ScmView.stagedChanges : ScmProvider.locators.ScmView.changes;
            const headers = await this.enclosingItem.findElements(locator);
            let header!: WebElement;

            for (const item of headers) {
                if (+await item.getAttribute('data-index') > index) {
                    header = item;
                }
            }
            if (!header) {
                return []
            }

            const startIndex = +await header.getAttribute('data-index');
            const depth = +await header.getAttribute('aria-level') + 1;

            const items = await this.enclosingItem.findElements(NewScmView.locators.ScmView.itemLevel(depth));
            for (const item of items) {
                const index = +await item.getAttribute('data-index');
                if (index > startIndex && index <= startIndex + count) {
                    elements.push(item);
                }
            }
        }
        return Promise.all(elements.map(async element => new ScmChange(element, this).wait()));
    }

    async getChangeCount(staged: boolean = false): Promise<number> {
        const locator = staged ? ScmProvider.locators.ScmView.stagedChanges : ScmProvider.locators.ScmView.changes;
        const rows = await this.enclosingItem.findElements(locator);
        const index = +await this.getAttribute('data-index');

        for (const row of rows) {
            if (+await row.getAttribute('data-index') > index) {
                const count = await rows[0].findElement(ScmChange.locators.ScmView.changeCount);
                return +await count.getText();
            }
        }
        return 0;
    }
}

class MultiMoreAction extends ElementWithContexMenu {
    constructor(scm: ScmProvider) {
        super(MoreAction.locators.ScmView.multiMore, scm);
    }
}