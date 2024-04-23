![titleBarItem](https://user-images.githubusercontent.com/4181232/56654111-918ffd00-668f-11e9-82a0-0e1cc2db2ad7.png)

#### Lookup

```typescript
import { TitleBar } from 'vscode-extension-tester';

// get an item from the title bar
const item = await new TitleBar().getItem('File');
```

#### Select the Item

```typescript
const contextMenu = item.select();
```

The rest of the functionality is exactly the same as other menu items, like [[ContextMenuItem]].
