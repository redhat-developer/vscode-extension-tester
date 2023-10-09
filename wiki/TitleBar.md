![titleBar](https://user-images.githubusercontent.com/4181232/56653724-986a4000-668e-11e9-9d5c-3d1998585f35.png)

Page object for the title bar. Works only if the selected title bar type is 'custom'. Native title bar is not supported.

#### Lookup
```typescript
import { TitleBar } from 'vscode-extension-tester';
...
const titleBar = new TitleBar();
```

#### Item Retrieval
```typescript
// find if an item with title exists
const exists = await titleBar.hasItem('File');
// get a handle for an item
const item = await titleBar.getItem('File');
// get all displayed items
const items = await titleBar.getItems();
```

#### Get Displayed Title
```typescript
const title = await titleBar.getTitle();
```

#### Get Window Controls Handle
```typescript
const controls = titleBar.getWindowControls();
```