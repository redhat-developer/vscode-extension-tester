<img width="1512" alt="ExtensionEditorDetailsSections" src="https://github.com/user-attachments/assets/b795e36c-41b2-4251-9d2a-58585377dfe0">

#### Lookup

```typescript
import { ExtensionEditorDetailsSection } from 'vscode-extension-tester';
...
const extensionEditorDetails = new ExtensionEditorDetailsSection();
```

You can get values using following functions:

```typescript
await extensionEditorDetails.getCategories();

await extensionEditorDetails.getResources();

await extensionEditorDetails.getMoreInfo();

await extensionEditorDetails.getMoreInfoItem("Identifier");

await extensionEditorDetails.getReadme(); // currently not supported (Blocked by https://github.com/redhat-developer/vscode-extension-tester/issues/1492)
```
