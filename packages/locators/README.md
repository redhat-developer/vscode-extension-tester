<h1 align="center">
  <img alt="ExTester for Visual Studio Code" width="75%" src="https://raw.githubusercontent.com/redhat-developer/vscode-extension-tester/main/icons/logo-text-side.png">
</h1>

<h2 align="center">Locators</h2>

<p align="center">Version-specific element locators for the <a href="https://github.com/redhat-developer/vscode-extension-tester">ExTester</a> Page Object API.</p>

## What it is

The page objects in [`@redhat-developer/page-objects`](https://www.npmjs.com/package/@redhat-developer/page-objects) never hard-code selectors. This package supplies them: a complete locator set for VS Code `1.37.0`, plus one diff file for every later VS Code version that changed part of the UI, up to the newest supported release. At startup the page-objects `LocatorLoader` takes the base set and merges every diff up to the VS Code version under test, so the same page object code works across all supported versions.

## Installation

You normally do not install this package yourself: [`vscode-extension-tester`](https://www.npmjs.com/package/vscode-extension-tester) depends on it and loads it automatically. Install it directly only when you use the page objects without the ExTester runner:

```bash
npm install --save-dev @redhat-developer/locators @redhat-developer/page-objects selenium-webdriver
```

Peer dependencies: `@redhat-developer/page-objects >= 1.0.0` and `selenium-webdriver ^4.48.0`.

## Usage

The package exports a single function, `getLocatorsPath()`, which returns the folder that contains the compiled locator files. Pass it to the page-objects loader:

```typescript
import { getLocatorsPath } from "@redhat-developer/locators";
import { LocatorLoader } from "@redhat-developer/page-objects";

// Locators for VS Code 1.134.0: the 1.37.0 base set with every later diff merged in
const locators = new LocatorLoader("1.134.0", "1.37.0", getLocatorsPath()).loadLocators();
```

To activate the page objects with these locators, call `initPageObjects` from `@redhat-developer/page-objects`; see that package's README.

## Adding or overriding locators

- **Your own extension's UI:** do not edit this package. Write a locator contribution file and pass it to `extest` with `--custom_page_objects`, as described in the [Custom Page Objects](https://redhat-developer.github.io/vscode-extension-tester/guides/custom-page-objects/) guide.
- **A VS Code update broke a built-in locator:** add or update the diff for that version in `lib/<version>.ts` and open a pull request. The [Contribution Guide](https://github.com/redhat-developer/vscode-extension-tester/blob/main/CONTRIBUTING.md) explains how to build the project and run the test suite.

## Feedback

- Bugs and feature requests: [open an issue](https://github.com/redhat-developer/vscode-extension-tester/issues/new/choose)
- Questions: [GitHub Discussions](https://github.com/redhat-developer/vscode-extension-tester/discussions)

## License

[Apache License 2.0](https://github.com/redhat-developer/vscode-extension-tester/blob/main/LICENSE)
