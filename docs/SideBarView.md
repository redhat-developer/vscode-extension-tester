![sideBar](https://user-images.githubusercontent.com/4181232/56655128-327fb780-6692-11e9-83d0-d19ff1f8a836.png)

#### Lookup

```typescript
import { ActivityBar, SideBarView } from 'vscode-extension-tester';
// to look up the currently open view (if any is open)
const view = new SideBarView();
// to open a specific view and look it up
const control = await new ActivityBar().getViewControl('Explorer');
const view1 = await control.openView();
```

#### Get Individual Parts

```typescript
// to get the title part
const titlePart = await view.getTitlePart();
// to get the content part
const content = await view.getContent();
```
