![setting](https://user-images.githubusercontent.com/4181232/62535346-76668900-b84b-11e9-8aa3-a07f25e1e37e.png)

#### Lookup

Settings can be located through a [[SettingsEditor]] object:

```typescript
import { Workbench } from 'vscode-extension-tester';
...
// open the settings editor and get a handle on it
const settingsEditor = await new Workbench().openSettings();

// look for a setting named 'Auto Save' under 'Editor' category
const setting = await settingsEditor.findSetting('Auto Save', 'Files');
```

#### Retrieve Information

```typescript
// get the title
const title = setting.getTitle();

// get the category
const category = setting.getCategory();

// get the description
const decription = await setting.getDescription();
```

#### Handling Values

All setting types share the same functions to manipulate their values, however the value types and possible options vary between setting types.

```typescript
// generic value retrieval
const value = await setting.getValue();

// generic setting of a value
await setting.setValue('off');
```

##### Setting Value Types

Currently, there are four supported types of setting values: **text box**, **combo box**, **checkbox**, **link** and **array of strings**.

- **Text box** allows putting in an arbitrary string value, though there might be value checks afterwards that are not handled by this class.
- **Combo box** only allows inputs from its range of options. If you cast the setting to `ComboSetting`, you will be able to retrieve these options by calling the `getValues` method.
- **Check box** only accepts boolean values, other values are ignored
- **Link** does not have any value, `getValue` and `setValue` throw an error. Instead, casting the object to `LinkSetting` will allow you to call the `openLink` method, which will open settings.json file in a text editor.
- **Array** settings are supported for type `string`. Each row of array is represented by `ArraySettingItem`.
