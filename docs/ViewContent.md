![contentPart](https://user-images.githubusercontent.com/4181232/56655995-9c995c00-6694-11e9-963b-e7dd159c26d7.png)

#### Lookup
```typescript
import { SideBarView } from 'vscode-extension-tester';
...
const contentPart = new SideBarView().getContent();
```

#### Get Sections
```typescript
// get a section by title, case insensitive
const section = await contentPart.getSection('Open Editors');
// get all sections
const sections = await contentPart.getSections();
```

#### Progress Bar
```typescript
// look if there is an active progress bar
const hasProgress = await contentPart.hasProgress();
```