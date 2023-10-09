/!\ DEPRECATED

Dialog for opening/adding files and folders into workspace.

#### Initialize
Since the dialogs are different on each system, you will need to initialize the dialog through ```DialogHandler```.
```typescript
import { DialogHandler } from 'vscode-extension-tester-native';
...
const dialog = await DialogHandler.getOpenDialog();
```

#### Select a Folder
```typescript
// navigate to a folder/file
await dialog.selectPath('/my/awesome/folder');
// confirm
await dialog.confirm();
// or cancel
await dialog.cancel();
```