![actionControl](https://user-images.githubusercontent.com/4181232/56589258-27bb1900-65e5-11e9-9aef-7643f44697f4.png)

#### Look up the ActionsControl by title
Import and find the control through activity bar 
```typescript
import { ActivityBar, ActionsControl } from 'vscode-extension-tester';
...
// get actions control for 'Manage'
const control: ActionsControl = new ActivityBar().getGlobalAction('Manage');
```

#### Open action menu
Click the action control to open its context menu
```typescript
const menu = await control.openActionMenu();
```

#### Get title
Get the control's title
```typescript
const title = control.getTitle();
```

#### Open context menu
Left click on the control to open the context menu (in this case has the same effect as openActionMenu)
```typescript
const menu = await control.openContextMenu();
```