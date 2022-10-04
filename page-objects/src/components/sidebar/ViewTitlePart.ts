import { ElementWithContexMenu } from "../ElementWithContextMenu";
import { AbstractElement } from "../AbstractElement";
import { By, SideBarView } from "../..";

/**
 * Page object representing the top (title) part of a side bar view
 */
export class ViewTitlePart extends ElementWithContexMenu {
    constructor(view: SideBarView = new SideBarView()) {
        super(ViewTitlePart.locators.ViewTitlePart.constructor, view);
    }

    /**
     * Returns the displayed title of the view
     * @returns Promise resolving to displayed title
     */
    async getTitle(): Promise<string> {
        return await this.findElement(ViewTitlePart.locators.ViewTitlePart.title).getText();
    }

    /**
     * Finds action buttons inside the view title part
     * @returns Promise resolving to array of TitleActionButton objects
     */
    async getActions(): Promise<TitleActionButton[]> {
        const actions: TitleActionButton[] = [];
        const elements = await this.findElements(ViewTitlePart.locators.ViewTitlePart.action);
        for (const element of elements) {
            const title = await element.getAttribute(ViewTitlePart.locators.ViewTitlePart.actionLabel);
            actions.push(await new TitleActionButton(TitleActionButton.locators.ViewTitlePart.actionContstructor(title), this).wait());
        }
        return actions;
    }

    /**
     * Finds an action button by title
     * @param title title of the button to search for
     * @returns Promise resolving to TitleActionButton object
     */
    async getAction(title: string): Promise<TitleActionButton> {
        return new TitleActionButton(TitleActionButton.locators.ViewTitlePart.actionContstructor(title), this);
    }
 }

 /**
  * Page object representing a button inside the view title part
  */
 export class TitleActionButton extends AbstractElement {

    constructor(actionConstructor: By, viewTitle: ViewTitlePart) {
        super(actionConstructor, viewTitle);
    }

    /**
     * Get title of the button
     */
    async getTitle(): Promise<string> {
        return await this.getAttribute(ViewTitlePart.locators.ViewTitlePart.actionLabel);
    }
 }