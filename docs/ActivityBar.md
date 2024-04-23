![activityBar](https://user-images.githubusercontent.com/4181232/56586855-c133fc00-65e0-11e9-9317-158d7fcedd43.png)

#### Look up the Activity Bar

Import and find the activity bar

```typescript
import { ActivityBar } from 'vscode-extension-tester';
...
const activityBar = new ActivityBar();
```

#### Get view controls

Get handles for all view controls/buttons that operate the view containers

```typescript
const controls = await activityBar.getViewControls();
```

#### Get view control by title

Find a view control/button in the activity bar by its title

```typescript
// get Explorer view control
const controls = await activityBar.getViewControl('Explorer');
```

#### Get global actions

Get handles for all global actions buttons on the bottom of the action bar

```typescript
const actions = await activityBar.getGlobalActions();
```

#### Get global action by title

Find global actions button by title

```typescript
const actions = await activityBar.getGlobalAction('Manage');
```

#### Open context menu

Left click on the activity bar to open the context menu

```typescript
const menu = await activityBar.openContextMenu();
```
