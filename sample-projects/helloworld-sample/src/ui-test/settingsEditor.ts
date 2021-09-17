import { expect } from 'chai';
import { CheckboxSetting, SettingsEditor, Workbench } from 'vscode-extension-tester';

describe('Settings Editor sample tests', () => {
    let settings: SettingsEditor;

    before(async () => {
        // open the settings (UI)
        settings = await new Workbench().openSettings();
    });

    it('Find and Manipulate a setting', async () => {
        // to search for a setting using title, category, subcategories (arguments in this particular order)
        // this particular setting is 'Files > Simple Dialog > Enable' (Main category > Subcategory > Title)
        const setting = await settings.findSetting('Enable', 'Files', 'Simple Dialog');

        // there are different types of settings (e.g. checkbox, combo, text, link)
        // to get a more specific interface, we can cast the object to the appropriate type
        const simpleDialogSetting = setting as CheckboxSetting;
        // now getValue will return a boolean since it is a checkbox
        expect(await simpleDialogSetting.getValue()).is.true;

        // we can also get the description
        const desc = await simpleDialogSetting.getDescription();
        expect(desc).contains('Enables the simple file dialog');

        // use 'setValue' to change the setting, the actual value depends on the type of the setting
        await simpleDialogSetting.setValue(true);
    });
});