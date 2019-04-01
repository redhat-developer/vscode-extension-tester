import { ElementWithContexMenu } from "../ElementWithContextMenu";
import { SideBarView, By } from "../../../extester";
import { AbstractElement } from "../AbstractElement";


export class ViewTitlePart extends ElementWithContexMenu {
    constructor(view: SideBarView) {
        super(By.className('composite title'), view);
    }

    async getTitle(): Promise<string> {
        return await this.findElement(By.tagName('h2')).getText();
    }

    async getActionButtons(): Promise<TitleActionButton[]> {
        const actions: TitleActionButton[] = [];
        const elements = await this.findElements(By.className(`action-label`));
        for (const element of elements) {
            const title = await element.getAttribute('title');
            actions.push(new TitleActionButton(title, this));
        }
        return actions;
    }

    async getActionButton(title: string): Promise<TitleActionButton> {
        return new TitleActionButton(title, this);
    }
 }

 export class TitleActionButton extends AbstractElement {
    constructor(title: string, viewTitle: ViewTitlePart) {
        super(By.xpath(`.//a[@title='${title}']`), viewTitle);
    }
 }