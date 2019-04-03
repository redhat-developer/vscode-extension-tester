import { ElementWithContexMenu } from "../ElementWithContextMenu";
import { SideBarView, By } from "../../../extester";
import { AbstractElement } from "../AbstractElement";

/**
 * Page object representing the top (title) part of a side bar view
 */
export class ViewTitlePart extends ElementWithContexMenu {
    constructor(view: SideBarView) {
        super(By.className('composite title'), view);
    }

    /**
     * Returns the displayed title of the view
     */
    async getTitle(): Promise<string> {
        return await this.findElement(By.tagName('h2')).getText();
    }

    /**
     * Finds action buttons inside the view title part
     * @returns array of TitleActionButton objects
     */
    async getActionButtons(): Promise<TitleActionButton[]> {
        const actions: TitleActionButton[] = [];
        const elements = await this.findElements(By.className(`action-label`));
        for (const element of elements) {
            const title = await element.getAttribute('title');
            actions.push(new TitleActionButton(title, this));
        }
        return actions;
    }

    /**
     * Finds an action button by title
     * @param title title of the button to search for
     */
    async getActionButton(title: string): Promise<TitleActionButton> {
        return new TitleActionButton(title, this);
    }
 }

 /**
  * Page object representing a button inside the view title part
  */
 export class TitleActionButton extends AbstractElement {
    constructor(title: string, viewTitle: ViewTitlePart) {
        super(By.xpath(`.//a[@title='${title}']`), viewTitle);
    }
 }