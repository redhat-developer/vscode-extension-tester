![webview sample](https://raw.githubusercontent.com/microsoft/vscode-extension-samples/master/webview-sample/demo.gif)

#### Lookup

```typescript
import { EditorView, WebView } from 'vscode-extension-tester';
...
// using EditorView
const webview = new EditorView().openEditor('webview-title');

// using the constructor assuming the editor is opened
const webview1 = new WebView();
```

#### Switching Context

In order to access the elements inside the web view frame, it is necessary to switch webdriver context into the frame. Analogically, to stop working with the web view, switching back is necessary.

```typescript
// to switch inside the web view frame, with optional customizable timeout
await webview.switchToFrame(5_000);

// to switch back to the default window
await webview.switchBack();
```

#### Searching for Elements Inside a Web View

Make sure when searching for and manipulating with elements inside (or outside) the web view that you have switched webdriver to the appropriate context. Also, be aware that referencing an element from the default window  while switched to the web view (and vice versa) will throw a `StaleElementReference` error.

```typescript
// first, switch inside the web view
await webview.switchToFrame();

// look for desired elements
const element = await webview.findWebElement(<locator>);
const elements = await webview.findWebElements(<locator>);

...
// after all web view manipulation is done, switch back to the default window
await webview.switchBack();
```
