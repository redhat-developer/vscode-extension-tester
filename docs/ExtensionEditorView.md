<img width="1512" alt="ExtensionEditorView" src="https://github.com/user-attachments/assets/df5a4809-7fa6-4417-9024-a9a35b8257e4">

#### Lookup

```typescript
import { ExtensionEditorView } from 'vscode-extension-tester';
...
const extensionEditor = new ExtensionEditorView();
```

#### Get values from opened extension

You can get individual values using following functions:

```typescript
await extensionEditor.getName();

await extensionEditor.getVersion();

await extensionEditor.getPublisher();

await extensionEditor.getDescription();

await extensionEditor.getCount();
```

#### Manage tabs

Tabs section can be managed by this editor as well. For work with 'Details' you can use ExtensionEditorDetailsSection.

```typescript
await extensionEditor.getTabs();

await extensionEditor.switchToTab("tabname");

await extensionEditor.getActiveTab();
```
