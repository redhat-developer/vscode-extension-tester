---
title: Supported Versions
description: Which VS Code, Node.js and operating system versions ExTester supports, and what the support policy is.
---

This page explains exactly which versions ExTester supports, what "supported" means, and what happens outside those ranges.

## Visual Studio Code

ExTester actively tests against — and guarantees support for — **the latest 3 minor releases of VS Code**.

The exact tested range is maintained automatically: whenever a new VS Code version is released, an automated workflow updates the `supportedVersions` field in the [`vscode-extension-tester` package.json](https://github.com/redhat-developer/vscode-extension-tester/blob/main/packages/extester/package.json) and runs the full test suite against it. See [Automated Version Updates](/vscode-extension-tester/guides/automated-version-updates/) for how that pipeline works. To check the tested range for the ExTester release you have installed, look at `supportedVersions` in `node_modules/vscode-extension-tester/package.json`.

Outside the tested window, the rules are:

| VS Code version | Status |
| --- | --- |
| Latest 3 minor releases | ✅ **Supported** — actively tested, bugs fixed |
| Older than the tested window, but ≥ `1.90.0` | ⚠️ **Best-effort** — will most likely work fine, but if something breaks over time it won't be fixed (contributions welcome) |
| Older than `1.90.0` | ❌ **Not supported** — ExTester fails fast with a clear error |

### Why 1.90 is the floor

VS Code `1.90` is the oldest release that ships a Chromium version (122) whose matching ChromeDriver is distributed through the [Chrome for Testing](https://googlechromelabs.github.io/chrome-for-testing/) infrastructure. Older VS Code builds need ChromeDriver versions that can no longer be provisioned, so ExTester refuses them with an explicit error instead of failing with an obscure download problem.

### Choosing a version in your tests

The VS Code version under test is controlled by the `--code_version` CLI option (or the `CODE_VERSION` environment variable):

| Value | Meaning |
| --- | --- |
| `latest` (default) | The newest released VS Code, even if slightly newer than the tested window |
| `max` | The newest version in ExTester's tested range |
| `min` | The oldest version in ExTester's tested range |
| e.g. `1.134.2` | That exact version |

Using an outdated version prints a warning naming the current stable release. Both the `stable` and `insider` streams are supported via the `--type` option.

See [Test Setup](/vscode-extension-tester/guides/test-setup/) for all CLI options and environment variables.

## Node.js

ExTester requires **Node.js 22 or newer** (declared in the packages' `engines` field). The general policy is to support the same [Node.js releases](https://nodejs.org/en/about/previous-releases) as **Visual Studio Code** and **Selenium WebDriver** do:

- [Contributing to Visual Studio Code — Prerequisites](https://github.com/microsoft/vscode/wiki/How-to-Contribute#prerequisites)
- [selenium-webdriver — Node Support Policy](https://github.com/SeleniumHQ/selenium/tree/trunk/javascript/node/selenium-webdriver#node-support-policy)

The latest LTS release is the recommended and fully supported choice; newer non-LTS releases are supported on a best-effort basis.

## Operating systems

| Linux | Windows | macOS |
| --- | --- | --- |
| ✅ (with caveats) | ✅ | ✅ (with caveats) |

ExTester CI runs on all three platforms. Some VS Code UI behaves differently per platform (for example the title bar and context menus on macOS) — check [Known Issues](https://github.com/redhat-developer/vscode-extension-tester/blob/main/KNOWN_ISSUES.md) for the current list of platform caveats before filing a bug.

## ExTester releases

Only the **latest released version** of ExTester is actively maintained — fixes and new VS Code support land in new releases, not in backports. If you are pinned to an older ExTester, the VS Code versions it was tested against are recorded in that release's `supportedVersions` field on npm.
