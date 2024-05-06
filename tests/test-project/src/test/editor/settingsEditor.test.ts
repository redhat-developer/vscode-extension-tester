import { expect } from 'chai';
import { SettingsEditor, Workbench, EditorView, ComboSetting, TextSetting, CheckboxSetting, ArraySetting, after, before } from 'vscode-extension-tester';

describe('Settings Editor', function () {
    let editor: SettingsEditor;

    before(async () => {
        this.timeout(30000);
        editor = await new Workbench().openSettings();
        await new Promise(t => setTimeout(t, 5_000)); // wait to be sure settings editor is loaded properly
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

        before(async () => {
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

        it('setValue works', async function () {
            const setting = await editor.findSetting('Custom Title Bar Visibility', 'Window') as ComboSetting;

            await setting.setValue('windowed');
            let value = await setting.getValue();
            expect(value).equals('windowed');

            await setting.setValue('auto');
            value = await setting.getValue();
            expect(value).equals('auto');
        });

        it('getDescription works', async function () {
            setting = await editor.findSetting('Title Bar Style', 'Window') as ComboSetting;
            const desc = await setting.getDescription();
            expect(desc).not.empty;
        });
    });

    describe('text setting', function () {
        let setting: TextSetting;

        before(async () => {
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

        before(async () => {
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

    describe('array setting', function () {
        let setting: ArraySetting;

        before(async () => {
            this.timeout(15000);
            setting = await editor.findSetting('Hello World Array', 'Test Project', 'General') as ArraySetting;
        });

        it('getItem works - using index', async function () {
            const item = await setting.getItem(1);
            expect(item).is.not.undefined;
            const value = await item?.getValue();
            expect(value).is.equal('Hello ExTester');
        });

        it('getItem works - using label', async function () {
            const item = await setting.getItem('Hello World');
            expect(item).is.not.undefined;
            const value = await item?.getValue();
            expect(value).is.equal('Hello World');
        });

        it('getItems works', async function () {
            const items = await setting.getItems();
            expect(items).is.not.empty;
            expect(items.length).is.equal(2);
        });

        it('getValues works', async function () {
            const values = await setting.getValues();
            expect(values).contains.members(['Hello World', 'Hello ExTester']);
        });

        it('addItem works', async function () {
            this.timeout(45000);
            const add1 = await setting.add();
            await add1.setValue('Add Item 1');
            await add1.ok();
            await waitUntilItemExists('Add Item 1');

            const add2 = await setting.add();
            await add2.setValue('Add Item 2');
            await add2.ok();
            await waitUntilItemExists('Add Item 2');

            const add3 = await setting.add();
            await add3.setValue('Add Item 3');
            await add3.ok();
            await waitUntilItemExists('Add Item 3');

            const newValue = await setting.getItem('Add Item 1');
            expect(await newValue?.getValue()).is.equal('Add Item 1');
        });

        it('removeItem works - using label', async function () {
            this.timeout(15000);
            const toRemove = await setting.getItem('Hello ExTester');
            await toRemove?.remove();
            await waitUntilItemNotExists('Hello ExTester');

            const values = await setting.getValues();
            expect(values.length).is.lessThan(5);
            expect(values).not.includes('Hello ExTester');
        });

        it('removeItem works - using index', async function () {
            this.timeout(15000);
            const toRemove = await setting.getItem(1);
            await toRemove?.remove();
            await waitUntilItemNotExists('Add Item 1');

            const values = await setting.getValues();
            expect(values.length).is.lessThan(4);
            expect(values).not.includes('Add Item 1');
        });

        it('editItem works - using label', async function () {
            this.timeout(15000);
            const toEdit = await setting.edit('Hello World');
            await toEdit?.setValue('Edit Item Label');
            await toEdit?.ok();
            await waitUntilItemExists('Edit Item Label');

            const values = await setting.getValues();
            expect(values).includes('Edit Item Label');
        });

        it('editItem works - using index', async function () {
            this.timeout(15000);
            const toEdit = await setting.edit(1);
            await toEdit?.setValue('Edit Item Index');
            await toEdit?.ok();
            await waitUntilItemExists('Edit Item Index');

            const values = await setting.getValues();
            expect(values).includes('Edit Item Index');
        });

        async function waitUntilItemExists(item: string, timeout: number = 10_000): Promise<void> {
            let values: string[] = [];
            await setting.getDriver().wait(async function () {
                values = await setting.getValues();
                return values.includes(item);
            }, timeout, `Expected item - '${item}' was not found in list of: ${values}`);
        }

        async function waitUntilItemNotExists(item: string, timeout: number = 10_000): Promise<void> {
            let values: string[] = [];
            await setting.getDriver().wait(async function () {
                values = await setting.getValues();
                return !values.includes(item);
            }, timeout, `Expected item - '${item}' was found in list of: ${values}`);
        }
    });

});
