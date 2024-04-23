In case your extension contributes a `CustomEditor`/`CustomTextEditor`. Both are based on a webview, and the page object is a combination of a `Webview` and common editor functionality.

#### Lookup

```typescript
import { CustomEditor } from 'vscode-extension-tester'
...
// make sure the editor is opened by now
const editor = new CustomEditor();
```

#### Webview

The whole editor is serviced by a [[WebView]], we just need to get a reference to it.

```typescript
const webview = editor.getWebView();
```

#### Common Functionality

Most editors share this:

```typescript
// check if there are unsaved changes
const dirty = await editor.isDirty();
// save
await editor.save();
// open 'save as' prompt
const prompt = await editor.saveAs();
// get title
const title = await editor.getTitle();
// get the editor tab
const tab = await editor.getTab();
```
