import { ViewSection } from "../ViewSection";
import { ExtensionsViewItem } from "./ExtensionsViewItem";
import { until, Key } from "selenium-webdriver";
import { ViewContent } from "../ViewContent";

/**
 * Categories of extensions to search for
 */
enum ExtensionCategory {
    Installed = '@installed',
    Enabled = '@enabled',
    Disabled = '@disabled',
    Outdated = '@outdated',
    Recommended = '@recommended'
}

/**
 * View section containing extensions
 */
export class ExtensionsViewSection extends ViewSection {

    async getVisibleItems(): Promise<ExtensionsViewItem[]> {
        const extensionTable = await this.findElement(ExtensionsViewSection.locators.ExtensionsViewSection.items);
        const extensionRows = await extensionTable.findElements(ExtensionsViewSection.locators.ExtensionsViewSection.itemRow);

        return await Promise.all(extensionRows.map(async row => new ExtensionsViewItem(row, this).wait()));
    }

    /**
     * Search for an extension by title. This utilizes the search bar
     * in the Extensions view, which switches the perspective to the
     * section representing the chosen category and temporarily hides all other sections.
     * If you wish to continue working with the initial view section
     * (i.e. Enabled), use the clearSearch method to reset it back to default
     * 
     * @param title title to search for in '@category name' format,
     * e.g '@installed extension'. If no @category is present, marketplace will be searched
     * 
     * @returns Promise resolving to ExtensionsViewItem if such item exists, undefined otherwise
     */
    async findItem(title: string): Promise<ExtensionsViewItem | undefined> {
        await this.clearSearch();
        const progress = await this.enclosingItem.findElement(ExtensionsViewSection.locators.ViewContent.progress);
        const searchField = await this.enclosingItem.findElement(ExtensionsViewSection.locators.ExtensionsViewSection.searchBox);
        await searchField.sendKeys(title);
        try {
            await this.getDriver().wait(until.elementIsVisible(progress), 1000);
        } catch (err) {
            if ((err as Error).name !== "TimeoutError"){
                throw err;
            }
        }
        await this.getDriver().wait(until.elementIsNotVisible(progress));

        const parent = this.enclosingItem as ViewContent;
        const sectionTitle = this.getSectionForCategory(title);

        const section = await parent.getSection(sectionTitle) as ExtensionsViewSection;
        
        const titleParts = title.split(' ');
        if (titleParts[0].startsWith('@')) {
            title = titleParts.slice(1).join(' ');
        }

        const extensions = await section.getVisibleItems();

        for (const extension of extensions) {
            if (await extension.getTitle() === title) {
                return extension;
            }
        }

        return undefined;
    }

    /**
     * Clears the search bar on top of the view
     * @returns Promise resolving when the search box is cleared
     */
    async clearSearch(): Promise<void> {
        const progress = await this.enclosingItem.findElement(ExtensionsViewSection.locators.ViewContent.progress);
        const searchField = await this.enclosingItem.findElement(ExtensionsViewSection.locators.ExtensionsViewSection.searchBox);
        const textField = await this.enclosingItem.findElement(ExtensionsViewSection.locators.ExtensionsViewSection.textContainer);

        try {
            await textField.findElement(ExtensionsViewSection.locators.ExtensionsViewSection.textField);
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
     * @returns Promise resolving when the item is clicked
     */
    async openItem(title: string): Promise<never[]> {
        const item = await this.findItem(title);
        if (item) {
            await item.click();
        }
        return [];
    }

    private getSectionForCategory(title: string): string {
        const category = title.split(' ')[0].toLowerCase();
        switch(category) {
            case ExtensionCategory.Disabled:
                return 'Disabled';
            case ExtensionCategory.Enabled:
                return 'Enabled';
            case ExtensionCategory.Installed:
                return 'Installed';
            case ExtensionCategory.Outdated:
                return 'Outdated';
            case ExtensionCategory.Recommended:
                return 'Other Recommendations';
            default:
                return 'Marketplace';
        }
    }
}