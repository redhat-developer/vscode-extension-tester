---
title: Opening Files and Folders
description: How to open files and folders in UI tests using openResources or the simple dialog.
---

Opening files and folders is a fundamental part of automating interactions in VS Code. The recommended approach is to use the `openResources` method provided by the `VSBrowser` API.

## openResources

```typescript
openResources(...args: (string | (() => void | Promise<any>))[]): Promise<void>
```

This method allows you to open one or more files and folders, **and optionally wait for additional conditions** once the workbench is loaded. It automatically waits for the workbench to be ready after opening resources.

- **Single folder**: Opens the folder in the explorer.
- **Multiple folders**: Opens a multi-root workspace.
- **Files**: Opens each file in a new editor tab.
- **Workspace file** (`.code-workspace`): Opens the workspace it defines (the window reloads, like opening a folder) instead of an editor tab.
- **Wait function** _(optional)_: Can be passed as the last argument (sync or async) and will be executed after the workbench is ready.

> **Tip:** Use **absolute paths** to avoid issues. Relative paths are resolved based on the current working directory (`process.cwd()`).

### Example

```ts
import * as path from "path";
import { VSBrowser } from "vscode-extension-tester";

await VSBrowser.instance.openResources(
  path.resolve(__dirname, "workspace/folder1"),
  path.resolve(__dirname, "workspace/file1.ts"),
  path.resolve(__dirname, "workspace/folder2"),
  async () => {
    // Optional: Wait for your custom UI element or state
    await new Promise((res) => setTimeout(res, 3000));
  },
);
```

## reloadWindow

```typescript
reloadWindow(waitForFn?: () => void | Promise<any>): Promise<void>
```

Reloads the VS Code window (`Developer: Reload Window`) and waits until the workbench is back, then runs the optional wait function. Use it instead of running the reload command yourself: elements found before the reload go stale, so look them up again afterwards.

```ts
await VSBrowser.instance.reloadWindow(async () => {
  // Optional: wait until your extension is active again
});
```

With the experimental [hidden window](/vscode-extension-tester/guides/hidden-window/), VS Code cannot reload, so `reloadWindow` restarts it with the same folder and reopens the files opened through `openResources` that were still open, with the active one active again. Saved files and settings carry over. Unsaved changes, extension `globalState`/`workspaceState`, the editor layout and editors opened some other way do not, so a test that checks those after a reload needs a visible window.

## Using Dialogs

When a test triggers a native open dialog (e.g. via `File > Open Folder...`), VS Code shows the **Simple Dialog** instead — an input box for entering the path. ExTester enables this automatically through its [default settings](/vscode-extension-tester/guides/test-setup/#how-custom-settings-propagate) (`files.simpleDialog.enable: true` and `window.dialogStyle: custom`), so no configuration is needed — native OS dialogs cannot be driven by WebDriver.

To handle the dialog in a test, drive it like any input box:

```typescript
const input = await InputBox.create();
await input.setText("/path/to/your/folder/");
await input.confirm();
```

Make sure to use a trailing separator for folders, otherwise confirming will only autocorrect the path and you'll need to call it again.
