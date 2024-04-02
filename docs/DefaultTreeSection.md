![section](https://user-images.githubusercontent.com/4181232/56656305-76c08700-6695-11e9-8630-e878ff478201.png)

The 'default' tree section, as used in the explorer view. All The behaviour is defined by the general [[ViewSection]] class.

#### Lookup
```typescript
import { SideBarView, DefaultTreeSection } from 'vscode-extension-tester';
...
// Type is inferred automatically, the type cast here is used to be more explicit
const section = await new SideBarView().getContent().getSection('workspace') as DefaultTreeSection;
```