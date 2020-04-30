import { ViewItem } from "../ViewItem";
import { until, WebElement } from "selenium-webdriver";
import { ContextMenu } from "../../menu/ContextMenu";
import { ExtensionsViewSection } from "./ExtensionsViewSection";

/**
 * Page object representing an extension in the extensions view
 */
export class ExtensionsViewItem extends ViewItem {

    constructor(extensionElement: WebElement, section: ExtensionsViewSection) {
        super(extensionElement, section);
    }

    /**
     * Get title of the extension
     */
    async getTitle(): Promise<string> {
        const title = await this.findElement(ExtensionsViewItem.locators.ExtensionsViewSection.itemTitle);
        return title.getText();
    }

    /**
     * Get version of the extension
     * @returns Promise resolving to version string
     */
    async getVersion(): Promise<string> {
        const version = await this.findElement(ExtensionsViewItem.locators.ExtensionsViewItem.version);
        return version.getText();
    }

    /**
     * Get the author of the extension
     * @returns Promise resolving to displayed author
     */
    async getAuthor(): Promise<string> {
        const author = await this.findElement(ExtensionsViewItem.locators.ExtensionsViewItem.author);
        return author.getText();
    }

    /**
     * Get the description of the extension
     * @returns Promise resolving to description
     */
    async getDescription(): Promise<string> {
        const description = await this.findElement(ExtensionsViewItem.locators.ExtensionsViewItem.description);
        return description.getText();
    }
    
    /**
     * Find if the extension is installed
     * @returns Promise resolving to true/false
     */
    async isInstalled(): Promise<boolean> {
        const button = await this.findElement(ExtensionsViewItem.locators.ExtensionsViewItem.install);
        if ((await button.getAttribute('class')).indexOf('disabled') > -1) {
            return true;
        }
        return false;
    }

    /**
     * Open the management context menu if the extension is installed
     * @returns Promise resolving to ContextMenu object
     */
    async manage(): Promise<ContextMenu> {
        const button = await this.findElement(ExtensionsViewItem.locators.ExtensionsViewItem.manage);
        if ((await button.getAttribute('class')).indexOf('disabled') > -1) {
            throw new Error(`Extension '${await this.getTitle()}' is not installed`);
        }
        return this.openContextMenu();
    }

    /**
     * Install the extension if not installed already
     * @returns Promise resolving when the Install button is clicked or not found at all
     */
    async install(): Promise<void> {
        if (await this.isInstalled()) {
            return;
        }
        const button = await this.findElement(ExtensionsViewItem.locators.ExtensionsViewItem.install);
        await button.click();
        await this.getDriver().wait(until.elementIsNotVisible(button));
    }
}