---
title: Installation
description: Add ExTester to your VS Code extension project and run your first UI test.
---

ExTester (published on npm as [`vscode-extension-tester`](https://www.npmjs.com/package/vscode-extension-tester)) is a package designed to help you run UI tests for your VS Code extensions using [Selenium WebDriver](https://www.npmjs.com/package/selenium-webdriver).

Install it into your extension's `devDependencies` to get started:

```bash
npm install --save-dev vscode-extension-tester
```

The package brings everything you need:

- The **`extest` CLI** that automates the whole test setup:
  - Downloads a test instance of VS Code
  - Downloads the matching version of ChromeDriver
  - Packages and installs your extension into the VS Code instance
  - Launches the VS Code instance using WebDriver
  - Runs your tests
- The **[Page Object APIs](/vscode-extension-tester/objects/)** for interacting with VS Code UI components without touching its DOM.

Before you start, check the [supported VS Code and Node.js versions](/vscode-extension-tester/getting-started/supported-versions/).

## Next steps

- [Write your first UI test](/vscode-extension-tester/getting-started/writing-simple-tests/)
- [Set up and configure test runs](/vscode-extension-tester/guides/test-setup/) — CLI usage, environment variables and `extester.config.json`
- [Configure the Mocha test runner](/vscode-extension-tester/guides/mocha-configuration/)

## ExTester Runner extension

For a streamlined testing workflow, we recommend installing the [ExTester Runner](https://marketplace.visualstudio.com/items?itemName=redhat.extester-runner) VS Code extension. It provides an enhanced UI for test orchestration and improves the overall developer experience. Learn more in the [ExTester Runner guide](/vscode-extension-tester/guides/extester-runner/).

## Example project

A complete working example of an extension tested with ExTester is available in the [vscode-extension-tester-example](https://github.com/redhat-developer/vscode-extension-tester-example) repository.
