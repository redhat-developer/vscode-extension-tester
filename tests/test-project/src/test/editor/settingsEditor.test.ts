import { expect } from 'chai';
import { SettingsEditor, Workbench, EditorView, ComboSetting, TextSetting, CheckboxSetting } from 'vscode-extension-tester';

describe('Settings Editor', function () {
    let editor: SettingsEditor;

    before(async function () {
        this.timeout(10000);
        editor = await new Workbench().openSettings();
    });

    after(async function () {
        await new EditorView().closeAllEditors();
    });

    it('findSetting works', async function () {
        this.timeout(15000);
        const setting = await editor.findSetting('Title Bar Style', 'Window');
        expect(setting).not.undefined;
    });

    it('findSetting by ID works', async function () {
        this.timeout(15000);
        const setting = await editor.findSettingByID('workbench.editor.enablePreview');
        expect(setting).not.undefined;
    });

    it('findSetting works for nested configurations', async function () {
        this.timeout(15000);
        const setting = await editor.findSetting('Hello World', 'Test Project', 'General');
        expect(setting).not.undefined;
    });

    describe('combo setting', function () {
        let setting: ComboSetting;

        before(async function () {
            this.timeout(15000);
            setting = await editor.findSetting('Title Bar Style', 'Window') as ComboSetting;
        });

        it('getTitle works', async function () {
            const title = await setting.getTitle();
            expect(title).equals('Title Bar Style');
        });

        it('getCategory works', async function () {
            const cat = await setting.getCategory();
            expect(cat).equals('Window:');
        });

        it('getValue works', async function () {
            const value = await setting.getValue();
            expect(value).equals('custom');
        });

        it('getValues works', async function () {
            const values = await setting.getValues();
            expect(values).contains.members(['native', 'custom']);
        });

        it('getDescription works', async function () {
            const desc = await setting.getDescription();
            expect(desc).not.empty;
        });
    });

    describe('text setting', function () {
        let setting: TextSetting;

        before(async function () {
            this.timeout(15000);
            setting = await editor.findSetting('Auto Save Delay', 'Files') as TextSetting;
        });

        it('getValue works', async function () {
            const value = await setting.getValue();
            expect(+value).greaterThan(0);
        });

        it('setValue works', async function () {
            const newVal = '1001';
            await setting.setValue(newVal);
            expect(await setting.getValue()).equals(newVal);
        });
    });

    describe('checkbox setting', function () {
        let setting: CheckboxSetting;

        before(async function () {
            this.timeout(15000);
            setting = await editor.findSetting('Code Lens', 'Editor') as CheckboxSetting;
        });

        it('getValue works', async function () {
            const value = await setting.getValue();
            expect(value).is.true;
        });

        it('setValue works', async function () {
            await setting.setValue(false);
            expect(await setting.getValue()).is.false;
            await setting.setValue(true);
        });
    });
});
