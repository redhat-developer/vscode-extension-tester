import { Editor } from "./Editor";
import { ContextMenu } from "../menu/ContextMenu";
import { WebElement, Key } from "selenium-webdriver";
import { AbstractElement } from "../AbstractElement";
import { EditorView, EditorGroup } from "../..";

/**
 * Page object representing the internal VSCode settings editor
 */
export class SettingsEditor extends Editor {
    
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
        const category = categories.join(' › ');
        const searchBox = await this.findElement(SettingsEditor.locators.Editor.inputArea);
        await searchBox.sendKeys(Key.chord(SettingsEditor.ctlKey, 'a'));
        await searchBox.sendKeys(`${category}: ${title}`);

        const count = await this.findElement(SettingsEditor.locators.SettingsEditor.itemCount);
        let textCount = await count.getText();

        await this.getDriver().wait(async() => {
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
                return (await this.createSetting(item, title, category)).wait();
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
            return new ComboSetting(title, category, this);
        } catch (err) {
            try {
                // try text setting
                await element.findElement(SettingsEditor.locators.SettingsEditor.textSetting);
                return new TextSetting(title, category, this);
            } catch (err) {
                try {
                    // try checkbox setting
                    await element.findElement(SettingsEditor.locators.SettingsEditor.checkboxSetting);
                    return new CheckboxSetting(title, category, this);
                } catch (err) {
                    // try link setting
                    try {
                        await element.findElement(SettingsEditor.locators.SettingsEditor.linkButton);
                        return new LinkSetting(title, category, this);
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
    private title: string;
    private category: string;

    constructor(title: string, category: string, settings: SettingsEditor) {
        super(SettingsEditor.locators.SettingsEditor.settingConstructor(title, category), settings);
        this.title = title;
        this.category = category;
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
    getCategory(): string {
        return this.category;
    }

    /**
     * Get description of the setting
     * @returns Promise resolving to setting description
     */
    async getDescription(): Promise<string> {
        const desc = await this.findElement(SettingsEditor.locators.SettingsEditor.settingDesctiption);
        return await desc.getText();
    }

    /**
     * Get title of the setting
     */
    getTitle(): string {
        return this.title;
    }
}

/**
 * Setting with a combo box 
 */
export class ComboSetting extends Setting {
    async getValue(): Promise<string> {
        const combo = await this.findElement(SettingsEditor.locators.SettingsEditor.comboSetting);
        return await combo.getAttribute('title');
    }

    async setValue(value: string): Promise<void> {
        const rows = await this.getOptions();
        for (let i = 0; i < rows.length; i++) {
            if ((await rows[i].getAttribute('class')).indexOf('disabled') < 0) {
                const text = await rows[i].findElement(SettingsEditor.locators.SettingsEditor.comboOption).getText();
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
            values.push(await row.findElement(SettingsEditor.locators.SettingsEditor.comboOption).getText())
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
        throw new Error('Value not available in settings editor.');
    }

    async setValue(value: string | boolean): Promise<void> {
        throw new Error('Value not available in settings editor.');
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
