![contextMenu](https://user-images.githubusercontent.com/4181232/56651979-88e8f800-668a-11e9-97f6-0a3a7b582a8d.png)
Page object for any context menu opened by left-clicking an element that has a context menu. Title bar items also produce context menus when clicked.

#### Open/Lookup

Typically, a context menu is opened by calling ```openContextMenu``` on elements that support it. For example:

```typescript
import { ActivityBar, ContextMenu } from 'vscode-extension-tester';
...
const menu = await new ActivityBar().openContextMenu();
```

#### Retrieve Items

```typescript
// find if an item with title exists
const exists = await menu.hasItem('Copy');
// get a handle for an item
const item = await menu.getItem('Copy');
// get all displayed items
const items = await menu.getItems();
```

#### Select Item

```typescript
// recursively select an item in nested submenus
await menu.select('File', 'Preferences', 'Settings');
// select an item that has a child submenu
const submenu = await menu.select('File', 'Preferences');
```
