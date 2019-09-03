import { ViewSection } from "../ViewSection";
import { ExtensionsViewItem } from "./ExtensionsViewItem";
import { By, until, Key } from "selenium-webdriver";
import { ViewContent } from "../ViewContent";

/**
 * View section containing extensions
 */
export class ExtensionsViewSection extends ViewSection {
    async getVisibleItems(): Promise<ExtensionsViewItem[]> {
        const items: ExtensionsViewItem[] = [];
        const elements = await this.findElements(By.className('monaco-list-row'));

        for (const element of elements) {
            const title = await element.findElement(By.className('name')).getText();
            items.push(await new ExtensionsViewItem(title, this).wait());
        }
        return items;
    }

    /**
     * Search for an extension by title. This utilizes the search bar
     * in the Extensions view, which switches the perspective to the
     * 'Marketplace' section and temporarily hides all other sections.
     * If you wish to continue working with the initial view section
     * (i.e. Enabled), use the clearSearch method to reset it back to default
     * 
     * @param title title to search for
     */
    async findItem(title: string): Promise<ExtensionsViewItem | undefined> {
        let item!: ExtensionsViewItem;
        await this.clearSearch();
        const progress = await this.enclosingItem.findElement(By.className('monaco-progress-container'));
        const searchField = await this.enclosingItem.findElement(By.className('inputarea'));
        await searchField.sendKeys(title);

        await this.getDriver().wait(until.elementIsVisible(progress));
        await this.getDriver().wait(until.elementIsNotVisible(progress));

        const parent = this.enclosingItem as ViewContent;
        const marketplace = await parent.getSection('Marketplace') as ExtensionsViewSection;

        try {
            item = await new ExtensionsViewItem(title, marketplace).wait();
        } catch(err) {
            console.log(err)
            // ignore and return undefined
        }
        return item;
    }

    /**
     * Clears the search bar on top of the view
     */
    async clearSearch(): Promise<void> {
        const progress = await this.enclosingItem.findElement(By.className('monaco-progress-container'));
        const searchField = await this.enclosingItem.findElement(By.className('inputarea'));
        const textField = await this.enclosingItem.findElement(By.className('view-line'));

        try {
            await textField.findElement(By.className('mtk1'));
            await searchField.sendKeys(Key.chord(ExtensionsViewItem.ctlKey, 'a'), Key.BACK_SPACE);
            await this.getDriver().wait(until.elementIsVisible(progress));
            await this.getDriver().wait(until.elementIsNotVisible(progress));
        } catch (err) {
            // do nothing, the text field is empty
        }
    }

    /**
     * Find and open an extension item
     * @param title title of the extension
     */
    async openItem(title: string): Promise<void> {
        const item = await this.findItem(title);
        if (item) {
            await item.click();
        }
    }
}