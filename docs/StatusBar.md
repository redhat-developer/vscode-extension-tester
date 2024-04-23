![status](https://user-images.githubusercontent.com/4181232/56661682-91e5c380-66a2-11e9-859d-1974cb98006d.png)

#### Lookup

```typescript
import { StatusBar } from 'vscode-extension-tester';
...
const statusbar = new StatusBar();
```

#### Notifications Center

```typescript
// open notifications center
const center = await statusbar.openNotificationsCenter();
// close
await statusbar.closeNotificationsCenter();
```

#### Editor Status

```typescript
// open language selection input
await statusbar.openLanguageSelection();
// get current language as string
const langString = await statusbar.getCurrentLanguage();
// open line ending selection input
await statusbar.openLineEndingSelection();
// get current line ending as string
const endingString = await statusbar.getCurrentLineEnding();
// open encoding selection input
await statusbar.openEncodingSelection();
// get current encoding as string
const encodingString = await statusbar.getCurrentEncoding();
// open indentation selection input
await statusbar.openIndentationSelection();
// get current indentation as string
const indentString = await statusbar.getCurrentIndentation();
// open line selection input
await statusbar.openLineSelection();
// get current position as string (Ln X, Col Y)
const posString = await statusbar.getCurrentPosition();
```

#### Arbitrary Status Items

```typescript
// find a status item by title
const item = await statusbar.getItem('Select Encoding');
// get all status items as web elements
const items = await statusbar.getItems();
```
