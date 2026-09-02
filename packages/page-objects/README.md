<h1 align="center">
  <img alt="ExTester for Visual Studio Code" width="75%" src="https://raw.githubusercontent.com/redhat-developer/vscode-extension-tester/main/icons/logo-text-side.png">
</h1>

<h2 align="center">Page Objects</h2>

<p align="center">Page Object API for the Visual Studio Code UI, used by the <a href="https://github.com/redhat-developer/vscode-extension-tester">ExTester</a> framework.</p>

## What it is

Page objects wrap the parts of the VS Code workbench in classes with meaningful methods, so a test can say `new ActivityBar().getViewControl('Explorer')` instead of searching the DOM. This package contains:

- Page object classes for the activity bar, side bar views and tree sections, editors (text, diff, settings, custom and web view), the bottom panel (problems, output, terminal and debug console), the status bar, title bar and menus, dialogs, notifications and the debug views.
- `AbstractElement`, the base class every page object extends, including your own custom ones.
- `LocatorLoader` and `mergeLocators`, which assemble the locator set for the VS Code version under test from [`@redhat-developer/locators`](https://www.npmjs.com/package/@redhat-developer/locators) and an optional custom contribution.
- `WaitHelper`, timeout constants and a re-export of `selenium-webdriver`, so one import gives you `WebDriver`, `By`, `Key` and the rest.

## Installation

[`vscode-extension-tester`](https://www.npmjs.com/package/vscode-extension-tester) depends on this package and re-exports everything from it. In an ExTester project you import page objects from `vscode-extension-tester` and never install this package directly:

```typescript
import { ActivityBar, EditorView, TextEditor } from "vscode-extension-tester";
```

Install it on its own only if you drive a VS Code instance with your own WebDriver setup:

```bash
npm install --save-dev @redhat-developer/page-objects @redhat-developer/locators selenium-webdriver
```

Peer dependencies: `selenium-webdriver ^4.48.0` and `typescript >= 4.6.2`.

## Standalone usage

The page objects must be initialised once before the first one is created. ExTester does this for you when `VSBrowser` starts; without ExTester, call `initPageObjects` yourself:

```typescript
import { getLocatorsPath } from "@redhat-developer/locators";
import { initPageObjects } from "@redhat-developer/page-objects";

initPageObjects(
  "1.134.0", // VS Code version under test
  "1.37.0", // version of the base locator set
  getLocatorsPath(), // folder with the compiled locators
  driver, // your selenium-webdriver WebDriver attached to VS Code
  browserName, // name of the browser the page objects run in
  "./out/test/pageObjects/locators.js", // optional custom locator contribution
);
```

## Documentation

- [Page Object Reference](https://redhat-developer.github.io/vscode-extension-tester/objects/) — every page object with examples
- [Custom Page Objects](https://redhat-developer.github.io/vscode-extension-tester/guides/custom-page-objects/) — extend the API for your own extension's UI

## Feedback

- Bugs and feature requests: [open an issue](https://github.com/redhat-developer/vscode-extension-tester/issues/new/choose)
- Questions: [GitHub Discussions](https://github.com/redhat-developer/vscode-extension-tester/discussions)

## License

[Apache License 2.0](https://github.com/redhat-developer/vscode-extension-tester/blob/main/LICENSE)
