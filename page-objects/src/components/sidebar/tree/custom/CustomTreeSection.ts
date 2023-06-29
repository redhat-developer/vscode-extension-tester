import { TreeSection } from "../TreeSection";
import { TreeItem } from "../../ViewItem";
import { Key, until, WebElement } from "selenium-webdriver";
import { CustomTreeItem, ViewContent } from "../../../..";

export type GenericCustomTreeItemConstructor<T extends TreeItem> = { new(rootElement: WebElement, tree: TreeSection): T ;};

/**
 * Generic custom tree view, e.g. contributed by an extension
 */
export class GenericCustomTreeSection<T extends TreeItem> extends TreeSection {
    private _itemConstructor: GenericCustomTreeItemConstructor<T>;

    constructor(panel: WebElement, private _viewContent: ViewContent, itemConstructor: GenericCustomTreeItemConstructor<T>) {
        super(panel, _viewContent);
        this._itemConstructor = itemConstructor;
    }

    private get viewContent() : ViewContent {
        return this._viewContent;
    }

    private get itemConstructor() : GenericCustomTreeItemConstructor<T> {
        return this._itemConstructor;
    }
    
    async getVisibleItems(): Promise<T[]> {
        const items: T[] = [];
        const container = await this.getContainer();
        const elements = await container.findElements(CustomTreeSection.locators.CustomTreeSection.itemRow);
        for (const element of elements) {
            if (await element.isDisplayed()) {
                items.push(new this.itemConstructor(element, this))
            }
        }
        return items;
    }

    async findItem(label: string, maxLevel: number = 0): Promise<T | undefined> {
        const elements = await this.getVisibleItems();
        for (const element of elements) {
            if (await element.getLabel() === label) {
                const level = +await element.getAttribute(CustomTreeSection.locators.ViewSection.level);
                if (maxLevel < 1 || level <= maxLevel) {
                    return element;
                } 
            }
        }
        return undefined;
    }

    private async getContainer(): Promise<GenericCustomTreeSection<T>> {
        await this.expand();
        await this.getDriver().wait(until.elementLocated(CustomTreeSection.locators.CustomTreeSection.rowContainer), 5000);
        const container = await this.findElement(CustomTreeSection.locators.CustomTreeSection.rowContainer);
        await container.sendKeys(Key.HOME);
        return new GenericCustomTreeSection(container, this.viewContent, this.itemConstructor);
    }
}

/**
 * Custom tree view, e.g. contributed by an extension
 */
export class CustomTreeSection extends GenericCustomTreeSection<CustomTreeItem> {
    constructor(panel: WebElement, viewContent: ViewContent) {
        super(panel, viewContent, CustomTreeItem);
    }
}
