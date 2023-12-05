Workbench is the container for all the other elements. As such it mainly offers convenience methods to get handles for its subparts. It also retrieves handles for elements that are not accessible from a particular subpart.

#### Lookup
```typescript
import { Workbench } from 'vscode-extension-tester'; 
...
const workbench = new Workbench();
```

#### Subparts Handles
```typescript
// get title bar handle
const titleBar = workbench.getTitleBar();

// get side bar handle
const sideBar = workbench.getSideBar();

// get activity bar handle
const activityBar = workbench.getActivityBar();

// get bottom bar handle
const bottomBar = workbench.getBottomBar();

// get editor view handle
const editorView = workbench.getEditorView();

// get notifications (outside notifications center)
const notifications = workbench.getNotifications();

// open notifications center
const center = workbench.openNotificationsCenter();
```

#### Command Prompt
You can also use ```Workbench``` to open the command prompt and execute commands.
```typescript
// open command prompt, can then be handled as a QuickOpenBox
const commandInput = await workbench.openCommandPrompt();

/* open command prompt and execute a command in it, the text does not need to be a perfect match
 uses VS Code's fuzzy search to find the best match */
await workbench.executeCommand('close workspace');
```

#### Settings
Opening the VS Code Settings editor is also available.
```typescript
const settingsEditor = await workbench.openSettings();
```
