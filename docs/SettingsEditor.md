![settings](https://user-images.githubusercontent.com/4181232/62535349-78304c80-b84b-11e9-80ae-25b587f11354.png)

#### Lookup

Settings editor can be opened through variety of ways, recommended way is using the [[Workbench]] class:

```typescript
import { Workbench, SettingsEditor } from 'vscode-extension-tester'
...
const settingsEditor = await new Workbench().openSettings();
```

#### Find a Setting Item in the Editor

Search for a setting with a given name and category, see more about the [[Setting]] object:

```typescript
// look for a setting named 'Auto Save' under 'Editor' category
const setting = await settingsEditor.findSetting("Auto Save", "Editor");

// find a setting in nested categories, e.g. 'Enable' in 'Files' > 'Simple Dialog'
const setting1 = await settingsEditor.findSetting("Enable", "Files", "Simple Dialog");
```

#### Switch Settings Perspectives

VSCode has two perspectives for its settings: 'User' and 'Workspace'. If your VSCode instance loads from both user and workspace settings.json files, you will be able to switch the perspectives in the editor:

```typescript
// switch to Workspace perspective
await settingsEditor.switchToPerspective("Workspace");
```
