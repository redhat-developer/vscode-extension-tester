![codeAssist](https://user-images.githubusercontent.com/4181232/56645020-20474e80-667d-11e9-9ebb-4f84c45d9080.png)

#### Open/Lookup
```typescript
import { TextEditor, ContentAssist } from 'vscode-extension-tester';
...
const contentAssist = await new TextEditor().toggleContentAssist(true);
```

#### Get Items
```typescript
// find if an item with given label is present
const hasItem = await contentAssist.hasItem('Get');
// get an item by label
const item = await contentAssist.getItem('Get');
// get all visible items
const items = await contentAssist.getItems();
```

#### Select an Item
```typescript
await contentAssist.getItem('Get').click();
```