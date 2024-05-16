![viewControl](https://user-images.githubusercontent.com/4181232/56588505-c47cb700-65e3-11e9-8636-8c35c1c1e648.png)

#### Look up the ViewControl by title

Import and find the control through activity bar

```typescript
import { ActivityBar, ViewControl } from 'vscode-extension-tester';
...
// get view control for Explorer
const control: ViewControl = new ActivityBar().getViewControl('Explorer');
```

#### Open view

Open the associated view if not already open and get a handler for it

```typescript
const view = await control.openView();
```

#### Close view

Close the associated view if open

```typescript
await control.closeView();
```

#### Get title

Get the control's/view's title

```typescript
const title = control.getTitle();
```

#### Open context menu

Left click on the control to open the context menu

```typescript
const menu = await control.openContextMenu();
```
