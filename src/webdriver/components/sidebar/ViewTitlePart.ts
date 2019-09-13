import { ElementWithContexMenu } from "../ElementWithContextMenu";
import { AbstractElement } from "../AbstractElement";
import { SideBarView } from "../../../extester";

/**
 * Page object representing the top (title) part of a side bar view
 */
export class ViewTitlePart extends ElementWithContexMenu {
    constructor(view: SideBarView = new SideBarView()) {
        super(ViewTitlePart.locators.ViewTitlePart.constructor, view);
    }

    /**
     * Returns the displayed title of the view
     */
    async getTitle(): Promise<string> {
        return await this.findElement(ViewTitlePart.locators.ViewTitlePart.title).getText();
    }

    /**
     * Finds action buttons inside the view title part
     * @returns array of TitleActionButton objects
     */
    async getActions(): Promise<TitleActionButton[]> {
        const actions: TitleActionButton[] = [];
        const elements = await this.findElements(ViewTitlePart.locators.ViewTitlePart.action);
        for (const element of elements) {
            const title = await element.getAttribute(ViewTitlePart.locators.ViewTitlePart.actionLabel);
            actions.push(await new TitleActionButton(title, this).wait());
        }
        return actions;
    }

    /**
     * Finds an action button by title
     * @param title title of the button to search for
     */
    async getAction(title: string): Promise<TitleActionButton> {
        return new TitleActionButton(title, this);
    }
 }

 /**
  * Page object representing a button inside the view title part
  */
 export class TitleActionButton extends AbstractElement {
    private title: string;

    constructor(title: string, viewTitle: ViewTitlePart) {
        super(TitleActionButton.locators.ViewTitlePart.actionContstructor(title), viewTitle);
        this.title = title;
    }

    /**
     * Get title of the button
     */
    getTitle(): string {
        return this.title;
    }
 }