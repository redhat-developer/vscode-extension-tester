![titlePart](https://user-images.githubusercontent.com/4181232/56655603-935bbf80-6693-11e9-98f3-0e20a3256047.png)

#### Lookup

```typescript
import { SideBarView } from 'vscode-extension-tester';
...
const titlePart = new SideBarView().getTitlePart();
```

#### Get Title

```typescript
const title = await titlePart.getTitle();
```

#### ActionButtons

Some views have action buttons in their title part.

```typescript
// get action button by title
const button = await titlePart.getActionButton('Clear');
// get all action buttons
const buttons = await titlePart.getActionButtons();
// click a button
await button.click();
```
