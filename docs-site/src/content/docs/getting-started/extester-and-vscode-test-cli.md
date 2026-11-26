---
title: ExTester and @vscode/test-cli
description: How ExTester compares with Microsoft's @vscode/test-cli, and when to use each one.
---

The two tools test different layers of your extension, and many extensions use both.

- **[`@vscode/test-cli`](https://github.com/microsoft/vscode-test-cli)**, built on `@vscode/test-electron`, runs your Mocha tests **inside the extension host**. Tests call the `vscode` API directly: they run commands, open documents and check what your extension returns. They can't see or click the rendered UI.
- **ExTester** runs your Mocha tests **outside VS Code** and drives the real window with Selenium WebDriver, the way a user would. Tests click menus, type into quick picks, and read tree views, webviews and notifications. They can't call the `vscode` API.

## Comparison

| | `@vscode/test-cli` | ExTester |
| --- | --- | --- |
| Kind of test | Integration tests against the VS Code API | UI and end-to-end tests against the rendered workbench |
| Where tests run | Inside the extension host | In a separate Node process that controls VS Code through ChromeDriver |
| `vscode` API in tests | ✅ Full access | ❌ None. You act through the UI, for example by running a command from the Command Palette |
| UI interaction (menus, views, quick picks, webviews, notifications, dialogs) | ❌ | ✅ Typed [page objects](/vscode-extension-tester/objects/) for each UI area |
| How your extension is loaded | `--extensionDevelopmentPath`, without packaging | Packaged with `vsce` and installed as a VSIX, so you test what you ship. A development path works too (`EXTENSION_DEV_PATH`, see [Test Setup](/vscode-extension-tester/guides/test-setup/)) |
| VS Code versions | Any released version, Stable or Insiders | The latest 3 minor releases are tested, with best-effort support back to 1.90, Stable or Insiders. See [Supported Versions](/vscode-extension-tester/getting-started/supported-versions/) |
| What gets downloaded | VS Code | VS Code and the matching ChromeDriver, both automatically |
| Test framework | Mocha | Mocha |
| Configuration | `.vscode-test.mjs`, `.js` or `.json`, with several named configurations | CLI flags, environment variables or [`extester.config.json`](/vscode-extension-tester/guides/test-setup/#using-a-config-file) |
| Code coverage | `--coverage` (c8) | `--coverage` (c8). See [Code Coverage](/vscode-extension-tester/guides/code-coverage/) |
| Watch mode | ✅ `--watch` | ❌ |
| Running tests from the editor | [Extension Test Runner](https://marketplace.visualstudio.com/items?itemName=ms-vscode.extension-test-runner) | [ExTester Runner](/vscode-extension-tester/guides/extester-runner/) |
| Screenshots of failed tests | ❌ | ✅ Automatic. See [Taking Screenshots](/vscode-extension-tester/guides/taking-screenshots/) |
| Other features | | [Locale testing](/vscode-extension-tester/guides/locale-testing/), [hidden test window](/vscode-extension-tester/guides/hidden-window/) (experimental, VS Code 1.147+), offline mode |
| Speed and maintenance | Fast. Changes to VS Code's UI don't affect the tests | Slower, because tests go through the real UI. VS Code UI changes need locator updates, which ExTester ships for each supported version |
| Maintained by | Microsoft | Red Hat |

## When to use which

**Use `@vscode/test-cli`** for behaviour you can reach through the API: command results, language features (completions, diagnostics, hovers), settings handling and activation. It's fast enough to run on every commit and should hold most of your tests.

**Use ExTester** for what a user sees and does: your views and tree items, webviews, quick picks and input boxes, notifications, context menus, the status bar and editor interactions. Also use it to check that the packaged VSIX installs and activates.

**Use both** if you want a broad, fast integration suite plus a smaller set of end-to-end tests for the key user flows. They don't conflict: give each its own test glob and npm script.

## Learn more

- [VS Code guide to testing extensions](https://code.visualstudio.com/api/working-with-extensions/testing-extension), which uses `@vscode/test-cli`
- [Installation](/vscode-extension-tester/getting-started/installation/), to add ExTester to your project
- [ExTester example project](https://github.com/redhat-developer/vscode-extension-tester-example)
