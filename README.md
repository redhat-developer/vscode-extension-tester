<h1 align="center">
  <img alt="ExTester for Visual Studio Code" width="75%" src="https://raw.githubusercontent.com/redhat-developer/vscode-extension-tester/main/icons/logo-text-side.png">
</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/vscode-extension-tester"><img src="https://img.shields.io/npm/v/vscode-extension-tester?label=extester&color=orange&style=for-the-badge&logo=npm" alt="vscode-extension-tester on npm"/></a>
  <a href="https://www.npmjs.com/package/@redhat-developer/page-objects"><img src="https://img.shields.io/npm/v/@redhat-developer/page-objects?color=orange&label=page%20objects&style=for-the-badge&logo=npm" alt="@redhat-developer/page-objects on npm"/></a>
  <a href="https://www.npmjs.com/package/@redhat-developer/locators"><img src="https://img.shields.io/npm/v/@redhat-developer/locators?color=orange&label=locators&style=for-the-badge&logo=npm" alt="@redhat-developer/locators on npm"/></a>
  <a href="https://open-vsx.org/extension/redhat/extester-runner"><img src="https://img.shields.io/open-vsx/v/redhat/extester-runner?label=runner&color=orange&style=for-the-badge&logo=vscodium&logoColor=white" alt="ExTester Runner on Open VSX"/></a>
  <br/>
  <a href="https://github.com/redhat-developer/vscode-extension-tester/actions/workflows/main.yml"><img src="https://img.shields.io/github/actions/workflow/status/redhat-developer/vscode-extension-tester/main.yml?branch=main&label=Main%20CI&style=for-the-badge&logo=githubactions&logoColor=white" alt="Main CI status"/></a>
  <a href="https://github.com/redhat-developer/vscode-extension-tester/actions/workflows/insiders.yml"><img src="https://img.shields.io/github/actions/workflow/status/redhat-developer/vscode-extension-tester/insiders.yml?branch=main&label=Insiders%20CI&style=for-the-badge&logo=githubactions&logoColor=white" alt="Insiders CI status"/></a>
  <a href="https://github.com/redhat-developer/vscode-extension-tester/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-Apache%202.0-yellow.svg?style=for-the-badge&logo=apache" alt="License: Apache 2.0"/></a>
</p>

<h2 align="center">UI testing framework for Visual Studio Code extensions</h2>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#packages">Packages</a> •
  <a href="#requirements">Requirements</a> •
  <a href="#quick-start">Quick start</a> •
  <a href="#extester-runner">ExTester Runner</a> •
  <a href="#documentation">Documentation</a> •
  <a href="#known-issues">Known issues</a>
</p>

ExTester runs [Selenium WebDriver](https://www.npmjs.com/package/selenium-webdriver) UI tests against a real instance of [Visual Studio Code](https://code.visualstudio.com/). It downloads VS Code and the matching ChromeDriver, installs your extension, launches the editor and runs your [Mocha](https://mochajs.org/) tests. A Page Object API covers the whole VS Code UI, so your tests never have to touch the editor's DOM.

## Features

- **Ready-made test environment** — downloads a test instance of VS Code (stable or insiders, any supported version) and the ChromeDriver build that matches it.
- **Installs your extension** into that instance, optionally together with the extensions it depends on.
- **Page Object API** for the activity bar, side bar, editors, bottom panel, status bar, title bar, dialogs, notifications, web views and more.
- **Mocha and TypeScript** — tests are ordinary Mocha suites with full type definitions.
- **Screenshots of failed tests** out of the box, and code coverage with a single flag.
- **Custom page objects and locators** to cover your own extension's UI.
- **CLI and API** — run from an npm script with `extest`, or drive the same steps from your own code.

## Packages

| Package                                                                                                                         | What it is                                                       | How you get it                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`vscode-extension-tester`](https://github.com/redhat-developer/vscode-extension-tester/tree/main/packages/extester)            | The framework: the `extest` CLI and the programmatic API         | `npm install --save-dev vscode-extension-tester`                                                                                                              |
| [`@redhat-developer/page-objects`](https://github.com/redhat-developer/vscode-extension-tester/tree/main/packages/page-objects) | Page Object API for the VS Code UI, re-exported by the framework | installed automatically as a dependency                                                                                                                       |
| [`@redhat-developer/locators`](https://github.com/redhat-developer/vscode-extension-tester/tree/main/packages/locators)         | Version-specific element locators used by the page objects       | installed automatically as a dependency                                                                                                                       |
| [ExTester Runner](https://github.com/redhat-developer/vscode-extension-tester/tree/main/packages/extester-runner)               | VS Code extension that lists and runs your UI tests              | [Marketplace](https://marketplace.visualstudio.com/items?itemName=redhat.extester-runner) · [Open VSX](https://open-vsx.org/extension/redhat/extester-runner) |

## Requirements

| Node.js                                            | Visual Studio Code                                                                     | Operating system                                                                 |
| -------------------------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 22 or newer; the latest LTS release is recommended | The latest 3 minor releases are tested; `1.90.0` and newer work on a best-effort basis | Linux, Windows and macOS; see [Known issues](#known-issues) for platform caveats |

The full policy, including how the tested VS Code range is kept up to date, is on the [Supported Versions](https://redhat-developer.github.io/vscode-extension-tester/getting-started/supported-versions/) page.

## Quick start

1. Add ExTester to your extension's `devDependencies`:

   ```bash
   npm install --save-dev vscode-extension-tester
   ```

2. Write a test, for example in `src/ui-test/example.test.ts`:

   ```typescript
   import { assert } from "chai";
   import { ActivityBar } from "vscode-extension-tester";

   describe("My extension", () => {
     it("shows the Explorer view", async () => {
       const control = await new ActivityBar().getViewControl("Explorer");
       assert.isDefined(control);
     });
   });
   ```

3. Add an npm script that points `extest` at the compiled tests, then run it:

   ```json
   "ui-test": "extest setup-and-run './out/ui-test/**/*.test.js'"
   ```

   ```bash
   npm run ui-test
   ```

`extest setup-and-run` downloads VS Code and ChromeDriver, packages and installs your extension, and runs the tests. Mocha's default 2 second timeout is rarely enough for UI tests, so raise it in a `.mocharc.js` file. [Writing Simple Tests](https://redhat-developer.github.io/vscode-extension-tester/getting-started/writing-simple-tests/) and [Test Setup](https://redhat-developer.github.io/vscode-extension-tester/guides/test-setup/) cover every option, including `extester.config.json`.

## ExTester Runner

The [ExTester Runner](https://marketplace.visualstudio.com/items?itemName=redhat.extester-runner) extension adds a view to the Activity Bar that lists your UI tests as a tree, runs a file, a folder or everything with one click, and shows the screenshots and logs from each run. It is also available on [Open VSX](https://open-vsx.org/extension/redhat/extester-runner). See the [ExTester Runner guide](https://redhat-developer.github.io/vscode-extension-tester/guides/extester-runner/).

## Documentation

The full documentation is at [redhat-developer.github.io/vscode-extension-tester](https://redhat-developer.github.io/vscode-extension-tester/).

- [Installation](https://redhat-developer.github.io/vscode-extension-tester/getting-started/installation/) and [Supported Versions](https://redhat-developer.github.io/vscode-extension-tester/getting-started/supported-versions/)
- [Writing Simple Tests](https://redhat-developer.github.io/vscode-extension-tester/getting-started/writing-simple-tests/)
- [Test Setup](https://redhat-developer.github.io/vscode-extension-tester/guides/test-setup/) — CLI commands, environment variables and `extester.config.json`
- [Mocha Configuration](https://redhat-developer.github.io/vscode-extension-tester/guides/mocha-configuration/)
- [Debugging Tests](https://redhat-developer.github.io/vscode-extension-tester/guides/debugging-tests/), [Taking Screenshots](https://redhat-developer.github.io/vscode-extension-tester/guides/taking-screenshots/) and [Code Coverage](https://redhat-developer.github.io/vscode-extension-tester/guides/code-coverage/)
- [Custom Page Objects](https://redhat-developer.github.io/vscode-extension-tester/guides/custom-page-objects/)
- [Page Object Reference](https://redhat-developer.github.io/vscode-extension-tester/objects/)

For a complete, runnable project see the [vscode-extension-tester-example](https://github.com/redhat-developer/vscode-extension-tester-example) repository.

## Known issues

Platform caveats and answers to the most common problems are collected in [KNOWN_ISSUES.md](https://github.com/redhat-developer/vscode-extension-tester/blob/main/KNOWN_ISSUES.md).

## Getting help

- Questions and ideas: [GitHub Discussions](https://github.com/redhat-developer/vscode-extension-tester/discussions)
- Bugs and feature requests: [open an issue](https://github.com/redhat-developer/vscode-extension-tester/issues/new/choose)
- Security vulnerabilities: follow the [security policy](https://github.com/redhat-developer/vscode-extension-tester/blob/main/SECURITY.md)

## Contributing

Contributions are welcome. The [Contribution Guide](https://github.com/redhat-developer/vscode-extension-tester/blob/main/CONTRIBUTING.md) explains how to build the project, run the test suite and submit a pull request.

## License

[Apache License 2.0](https://github.com/redhat-developer/vscode-extension-tester/blob/main/LICENSE)
