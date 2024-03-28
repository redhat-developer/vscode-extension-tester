import { Editor } from "./Editor";
import { ContextMenu } from "../menu/ContextMenu";
import { WebElement, Key, By } from "selenium-webdriver";
import { AbstractElement } from "../AbstractElement";
import { EditorView, EditorGroup } from "../..";

/**
 * Page object representing the internal VSCode settings editor
 */
export class SettingsEditor extends Editor {

    private divider = SettingsEditor.versionInfo.version >= '1.83.0' ? '›' : ' › ';
    
    constructor(view: EditorView | EditorGroup = new EditorView()) {
        super(view);
    }

    /**
     * Search for a setting with a particular title and category.
     * Returns an appropriate Setting object if the label is found,
     * undefined otherwise.
     *
     * If your setting has nested categories (i.e `example.general.test`),
     * pass in each category as a separate string.
     *
     * @param title title of the setting
     * @param categories category of the setting
     * @returns Promise resolving to a Setting object if found, undefined otherwise
     */
    async findSetting(title: string, ...categories: string[]): Promise<Setting> {
        const category = categories.join(this.divider);
        const searchBox = await this.findElement(SettingsEditor.locators.Editor.inputArea);
        await searchBox.sendKeys(Key.chord(SettingsEditor.ctlKey, 'a'));
        await searchBox.sendKeys(`${category}${this.divider}${title}`);

        return await this._getSettingItem(title, category);
    }

    /**
     * Search for a setting with a precise ID.
     * Returns an appropriate Setting object if it exists,
     * undefined otherwise.
     *
     * @param id of the setting
     * @returns Promise resolving to a Setting object if found, undefined otherwise
     */
    async findSettingByID(id: string): Promise<Setting> {
        const searchBox = await this.findElement(SettingsEditor.locators.Editor.inputArea);
        await searchBox.sendKeys(Key.chord(SettingsEditor.ctlKey, 'a'));
        await searchBox.sendKeys(id);

        const title = id.split('.').pop();
        return await this._getSettingItem(title);
    }

    private async _getSettingItem(title: string = '', category: string = ''): Promise<Setting> {
        const count = await this.findElement(SettingsEditor.locators.SettingsEditor.itemCount);
        let textCount = await count.getText();
        await this.getDriver().wait(async function() {
            await new Promise(res => setTimeout(res, 1500));
            const text = await count.getText();
            if (text !== textCount) {
                textCount = text;
                return false;
            }
            return true;
        });

        let setting!: Setting;
        const items = await this.findElements(SettingsEditor.locators.SettingsEditor.itemRow);
        for (const item of items) {
            try {
                const _category = (await (await item.findElement(SettingsEditor.locators.SettingsEditor.settingCategory)).getText()).replace(':', '');
                const _title = await (await item.findElement(SettingsEditor.locators.SettingsEditor.settingLabel)).getText();
                if(category !== '') {
                    if(category.toLowerCase().replace(this.divider, '').replace(/\s/g, '').trim() !== _category.toLowerCase().replace(this.divider, '').replace(/\s/g, '').trim()) {
                        continue;
                    }
                }
                if(title !== '') {
                    if(title.toLowerCase().replace(/\s/g, '').trim() !== _title.toLowerCase().replace(/\s/g, '').trim()) {
                        continue;
                    }
                }
                return await (await this.createSetting(item, _title, _category)).wait();
            } catch (err) {
            }
        }
        return setting;
    }

    /**
     * Switch between settings perspectives
     * Works only if your vscode instance has both user and workspace settings available
     * 
     * @param perspective User or Workspace
     * @returns Promise that resolves when the appropriate button is clicked
     */
    async switchToPerspective(perspective: 'User' | 'Workspace'): Promise<void> {
        const actions = await this.findElement(SettingsEditor.locators.SettingsEditor.header)
            .findElement(SettingsEditor.locators.SettingsEditor.tabs)
            .findElement(SettingsEditor.locators.SettingsEditor.actions);
        await actions.findElement(SettingsEditor.locators.SettingsEditor.action(perspective)).click();
    }

    /**
     * Context menu is disabled in this editor, throw an error
     */
    async openContextMenu(): Promise<ContextMenu> {
        throw new Error('Operation not supported');
    }

    private async createSetting(element: WebElement, title: string, category: string): Promise<Setting> {
        await element.findElement(SettingsEditor.locators.SettingsEditor.settingConstructor(title, category));
        try {
            // try a combo setting
            await element.findElement(SettingsEditor.locators.SettingsEditor.comboSetting);
            return new ComboSetting(SettingsEditor.locators.SettingsEditor.settingConstructor(title, category), this);
        } catch (err) {
            try {
                // try text setting
                await element.findElement(SettingsEditor.locators.SettingsEditor.textSetting);
                return new TextSetting(SettingsEditor.locators.SettingsEditor.settingConstructor(title, category), this);
            } catch (err) {
                try {
                    // try checkbox setting
                    await element.findElement(SettingsEditor.locators.SettingsEditor.checkboxSetting);
                    return new CheckboxSetting(SettingsEditor.locators.SettingsEditor.settingConstructor(title, category), this);
                } catch (err) {
                    // try link setting
                    try {
                        await element.findElement(SettingsEditor.locators.SettingsEditor.linkButton);
                        return new LinkSetting(SettingsEditor.locators.SettingsEditor.settingConstructor(title, category), this);
                    } catch (err) {
                        throw new Error('Setting type not supported');
                    }
                }
            }
        }
    }
}

/**
 * Abstract item representing a Setting with title, description and
 * an input element (combo/textbox/checkbox/link)
 */
export abstract class Setting extends AbstractElement {

    constructor(settingsConstructor: By, settings: SettingsEditor) {
        super(settingsConstructor, settings);
    }

    /**
     * Get the value of the setting based on its input type
     * 
     * @returns promise that resolves to the current value of the setting
     */
    abstract getValue(): Promise<string | boolean>
    
    /**
     * Set the value of the setting based on its input type
     *
     * @param value boolean for checkboxes, string otherwise
     */
    abstract setValue(value: string | boolean): Promise<void>

    /**
     * Get the category of the setting
     * All settings are labeled as Category: Title
     */
    async getCategory(): Promise<string> {
        return await (await this.findElement(SettingsEditor.locators.SettingsEditor.settingCategory)).getText();
    }

    /**
     * Get description of the setting
     * @returns Promise resolving to setting description
     */
    async getDescription(): Promise<string> {
        return await (await this.findElement(SettingsEditor.locators.SettingsEditor.settingDesctiption)).getText();
    }

    /**
     * Get title of the setting
     */
    async getTitle(): Promise<string> {
        return await (await this.findElement(SettingsEditor.locators.SettingsEditor.settingLabel)).getText();
    }
}

/**
 * Setting with a combo box 
 */
export class ComboSetting extends Setting {

    async getValue(): Promise<string> {
        const combo = await this.findElement(SettingsEditor.locators.SettingsEditor.comboSetting);
        return await combo.getAttribute(SettingsEditor.locators.SettingsEditor.comboValue);
    }

    async setValue(value: string): Promise<void> {
        const rows = await this.getOptions();
        for (let i = 0; i < rows.length; i++) {
            if ((await rows[i].getAttribute('class')).indexOf('disabled') < 0) {
                const text = await (await rows[i].findElement(SettingsEditor.locators.SettingsEditor.comboOption)).getText();
                if (value === text) {
                    return await rows[i].click();
                }
            }
        }
    }

    /**
     * Get the labels of all options from the combo
     * @returns Promise resolving to array of string values
     */
    async getValues(): Promise<string[]> {
        const values = [];
        const rows = await this.getOptions();

        for (const row of rows) {
            values.push(await (await row.findElement(SettingsEditor.locators.SettingsEditor.comboOption)).getText())
        }
        return values;
    }

    private async getOptions(): Promise<WebElement[]> {
        const menu = await this.openCombo();
        return await menu.findElements(SettingsEditor.locators.SettingsEditor.itemRow);
    }

    private async openCombo(): Promise<WebElement> {
        const combo = await this.findElement(SettingsEditor.locators.SettingsEditor.comboSetting);
        const workbench = await this.getDriver().findElement(SettingsEditor.locators.Workbench.constructor);
        const menus = await workbench.findElements(SettingsEditor.locators.ContextMenu.contextView);
        let menu!: WebElement;

        if (menus.length < 1) {
            await combo.click();
            menu = await workbench.findElement(SettingsEditor.locators.ContextMenu.contextView);
            return menu;
        } else if (await menus[0].isDisplayed()) {
            await combo.click();
            await this.getDriver().sleep(200);
        }
        await combo.click();
        menu = await workbench.findElement(SettingsEditor.locators.ContextMenu.contextView);
        return menu;
    }
}

/**
 * Setting with a text box input
 */
export class TextSetting extends Setting {

    async getValue(): Promise<string> {
        const input = await this.findElement(SettingsEditor.locators.SettingsEditor.textSetting);
        return await input.getAttribute('value');
    }

    async setValue(value: string): Promise<void> {
        const input = await this.findElement(SettingsEditor.locators.SettingsEditor.textSetting);
        await input.clear();
        await input.sendKeys(value);
    } 
}

/**
 * Setting with a checkbox
 */
export class CheckboxSetting extends Setting {

    async getValue(): Promise<boolean> {
        const checkbox = await this.findElement(SettingsEditor.locators.SettingsEditor.checkboxSetting);
        const checked = await checkbox.getAttribute(SettingsEditor.locators.SettingsEditor.checkboxChecked);
        if (checked === 'true') {
            return true;
        }
        return false;
    }

    async setValue(value: boolean): Promise<void> {
        const checkbox = await this.findElement(SettingsEditor.locators.SettingsEditor.checkboxSetting);
        if (await this.getValue() !== value) {
            await checkbox.click();
        }
    } 
}

/**
 * Setting with no value, with a link to settings.json instead
 */
export class LinkSetting extends Setting {

    async getValue(): Promise<string> {
        throw new Error('Method getValue is not available for LinkSetting');
    }

    async setValue(value: string | boolean): Promise<void> {
        throw new Error('Method setValue is not available for LinkSetting');
    }

    /**
     * Open the link that leads to the value in settings.json
     * @returns Promise resolving when the link has been clicked
     */
    async openLink(): Promise<void> {
        const link = await this.findElement(SettingsEditor.locators.SettingsEditor.linkButton);
        await link.click();
    }
}
