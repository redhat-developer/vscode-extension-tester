<h1 align="center">
  <br>
  Visual Studio Code Extension Tester
</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/vscode-extension-tester"><img src="https://img.shields.io/npm/v/vscode-extension-tester?label=extester&color=orange&style=for-the-badge" alt="VSCode ExTester"/></a>
  <a href="https://www.npmjs.com/package/vscode-extension-tester-locators"><img src="https://img.shields.io/npm/v/vscode-extension-tester-locators?color=orange&label=locators&style=for-the-badge" alt="ExTester Locators"/></a>
  <a href="https://www.npmjs.com/package/monaco-page-objects"><img src="https://img.shields.io/npm/v/monaco-page-objects?color=orange&label=page%20objects&style=for-the-badge" alt="ExTester Page Objects"/></a>
  <a href="https://github.com/redhat-developer/vscode-extension-tester/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-Apache%202-blue.svg?style=for-the-badge&logo=appveyor" alt="License"/></a>
  </br>
  <a href="https://github.com/redhat-developer/vscode-extension-tester/actions/workflows/main.yml"><img src="https://img.shields.io/github/actions/workflow/status/redhat-developer/vscode-extension-tester/main.yml?label=Main%20CI&style=for-the-badge" alt="Main CI"></a>
  <a href="https://github.com/redhat-developer/vscode-extension-tester/actions/workflows/insiders.yml"><img src="https://img.shields.io/github/actions/workflow/status/redhat-developer/vscode-extension-tester/insiders.yml?branch=main&label=Insider%20CI&style=for-the-badge" alt="Insider CI"></a>
</p><br/>

<h2 align="center">UI Testing Framework for Visual Studio Code.</h2>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#requirements">Requirements</a> •
  <a href="#usage">Usage</a> •
  <a href="https://github.com/redhat-developer/vscode-extension-tester/wiki/">Documentation</a> •
  <a href="#known-issues">Known Issues</a>
</p>

<p align="center">
Extension Tester is a package that is designed to help you run UI tests for your <a href="https://code.visualstudio.com/">Visual Studio Code</a> extensions using <a href="https://www.npmjs.com/package/selenium-webdriver">selenium-webdriver</a>.
</p><br/>

### Features

- Download a test instance of Visual Studio Code
- Download the appropriate version of ChromeDriver
- Package and Install your extension into downloaded VS Code instance
- Launch the VS Code instance using Selenium Webdriver
- Run your tests

### Requirements

- **Visual Studio Code 1.37+**
- **NodeJS <=18.15.0**
- Supported Operating Systems
  - **Linux**
  - **Windows**
  - **macOS** (platform specific limitations, more in [Known Issues](KNOWN_ISSUES.md#macos-known-limitations-of-native-objects))

### Usage

Simply install our package into your extension devDependencies to get started:

```npm
npm install --save-dev vscode-extension-tester@latest
```

Make sure to check out the [documentation](#documentation) for detailed instructions.

- [How to set up the tests](../../wiki/Test-Setup)
- [Configuring Mocha](../../wiki/Mocha-Configuration)
- [An example simple test case](../../wiki/Writing-Simple-Tests)
- [Page object API quick guide](../../wiki/Page-Object-APIs)

### Documentation

Our full documentation is located in [GitHub Wiki](https://github.com/redhat-developer/vscode-extension-tester/wiki). Included are details about Page Object API and how to setup Mocha tests information.

### Issues

Something is not working properly? In that case, feel free to [open issues, add feature requests, report bugs, etc.](https://github.com/redhat-developer/vscode-extension-tester/issues)

### Get Involved

If you'd like to help us get better, we appreciate it! Check out our [Contribution Guide](CONTRIBUTING.md) on how to do that.

### Known Issues

We have prepared few answers for most common problems community reported. See [Known Issues](KNOWN_ISSUES.md)
