---
title: Running With a Hidden Window
sidebar:
  badge:
    text: Experimental
    variant: caution
---

:::caution[Experimental]
The hidden window mode is experimental. It depends on VS Code's extension test mode, which changes some workbench behaviour (see below), and its options and behaviour may change in future releases without a major version bump. Please report problems on [GitHub](https://github.com/redhat-developer/vscode-extension-tester/issues).
:::

A local UI test run normally opens a VS Code window on top of your work and takes keyboard focus every time it starts. From VS Code **1.147.0**, ExTester can launch the test instance with a window that is never shown or focused, so you can keep working while the tests run.

```shell
npx extest setup-and-run './out/ui-test/*.test.js' --hidden_window
```

Or in `extester.config.json`:

```json
{
  "run": {
    "hiddenWindow": true
  }
}
```

You can also set `EXTESTER_HIDDEN_WINDOW=true` in the environment, for example in a launch configuration or a shell profile.

In the [ExTester Runner](/vscode-extension-tester/guides/extester-runner/#running-tests-with-a-hidden-window) extension, turn on the **Hidden Window** setting (`extesterRunner.hiddenWindow`).

---

## What still works

The window is hidden, not headless: VS Code lays out and paints the workbench at its normal (maximized) size, and timers and animation frames are not throttled. WebDriver talks to it as before, so clicks, key presses, the command palette, tree views, editors and terminals all work, and [screenshots](/vscode-extension-tester/guides/taking-screenshots/) on failure show the full workbench.

## Differences to keep in mind

- **No OS focus.** `document.hasFocus()` is `false` in the hidden window. Tests that check native focus state, or that rely on blur/focus events of the window itself, can behave differently.
- **Extension Development Host.** VS Code honours `--hidden-window` only while it runs extension tests, so ExTester also passes `--extensionTestsPath` with a small generated runner that keeps VS Code open until ExTester closes it. The window title gets the `[Extension Development Host]` prefix, and extensions loaded from `EXTENSION_DEV_PATH` see `ExtensionMode.Test` instead of `ExtensionMode.Development`. When `EXTENSION_DEV_PATH` is not set, ExTester also adds a manifest-only "ExTester hidden window host" extension as the development path; it appears among the extensions under development.
- **Opening a folder or workspace restarts VS Code.** In extension test mode VS Code cannot switch its window to another folder, so `VSBrowser.openResources()` with a folder or `.code-workspace` file quits the hidden instance and launches a new one with the resources. `VSBrowser.instance.driver` stays valid, but elements found before go stale (as they do when a visible window reloads into another folder) and UI state such as open editors does not carry over. The user data dir is kept, so settings, keybindings and snippets a test changed before stay as they are, as in a visible window. The driver logs (`test.log`, `chromedriver.log`) of all VS Code sessions are kept in the same files. Opening files works as usual. Opening a folder through the UI (File > Open Folder) is not supported.
- **The workspace cannot change from inside the window.** Extension code that enters a new workspace, such as `vscode.workspace.updateWorkspaceFolders()` removing the last folder or turning a folder into a multi-root workspace, Add Folder to Workspace, Save Workspace As, or the `vscode.openFolder` command, fails with "Entering a new workspace is not possible in tests." Use `VSBrowser.instance.openResources()` to change folders instead.
- **Dialogs are not shown.** In extension test mode VS Code answers confirmation dialogs with "yes", answers "Save changes?" with "Don't Save", and fails other dialogs instead of showing them. Tests of `ModalDialog` or dialog flows should skip themselves when `VSBrowser.instance.isHiddenWindow` is `true`; it is set before the test files load, so it can be read at the top of a file.
- **State is kept in memory.** VS Code does not persist UI state (storage) in extension test mode.
- **Native UI still shows.** Native dialogs and native context menus are separate OS windows and would still appear. ExTester's default settings (`window.titleBarStyle`, `window.dialogStyle` and `files.simpleDialog.enable`) already switch to the custom HTML variants.
- **The clipboard is shared.** Page objects that copy or paste text (for example `TextEditor.getText()` and `Input.setText()`) go through your system clipboard, as in a visible run.
- **The Dock icon.** On macOS the hidden VS Code is still a regular app, so its icon can appear in the Dock while tests run, even though no window does.
- **Slow first frames on Linux.** Under X11/Xvfb a window that is never shown sometimes starts without being drawn (a few animation frames per second), so UI updates can lag. Under Xvfb the window is already off your screen, so `xvfb-run` without `--hidden_window` is an alternative.
- **Older VS Code.** With a VS Code release before 1.147.0, or a version ExTester cannot parse, ExTester prints a warning and shows the window as usual.

## When to use it

The hidden window is meant for local runs. CI machines have nobody to disturb, and a visible window is easier to watch while you debug a failing test, so leave it off there.
