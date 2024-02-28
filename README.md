<h1 align="center">
  <img alt="ExTester for Visual Studio Code" width="75%" height="75%" src="./icons/logo-text-side.png">
</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/vscode-extension-tester"><img src="https://img.shields.io/npm/v/vscode-extension-tester?label=extester&color=orange&style=for-the-badge" alt="ExTester"/></a>
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
<b>ExTester</b>: Your Essential UI Testing Companion for <a href="https://code.visualstudio.com/">Visual Studio Code</a> Extensions!<br>Seamlessly execute UI tests with <a href="https://www.npmjs.com/package/selenium-webdriver">Selenium WebDriver</a>, ensuring robustness and reliability in your extension development journey. Simplify UI testing for your VS Code extensions and elevate the quality of your user interface effortlessly. Dive into efficient testing with ExTester today!
</p><br/>

### Features

- ⭐ Download a test instance of Visual Studio Code.
- ⭐ Download the appropriate version of ChromeDriver.
- ⭐ Pack and Install your extension into downloaded VS Code instance.
- ⭐ Launch the VS Code instance using Selenium WebDriver.
- ⭐ Run your tests.

### Requirements

|NodeJS|Visual Studio Code|Operating System|
|--|--|--|
|<table style="text-align:center;"> <tr><th>18.x.x</th><th>LTS</th><th>Latest</th></tr><tr><td>✅</td><td>❓</td><td>❓</td></tr><tr><td colspan="3">❓ Best-effort</td></tr> </table>| <table style="text-align:center;"> <tr><th>min</th><th>-</th><th>max</th></tr><tr><td>1.85.x</td><td>1.86.x</td><td>1.87.x</td></tr> </table>| <table style="text-align:center;"> <tr><th>Linux</th><th>Windows</th><th>macOS</th></tr><tr><td>✅</td><td>✅</td><td>⚠️</td></tr><tr><td colspan="3">⚠️ [Known Issues](KNOWN_ISSUES.md#macos-known-limitations-of-native-objects)</td></tr> </table>|

#### NodeJS Support Policy

ExTester is aiming same support for [NodeJS releases](https://nodejs.org/en/about/previous-releases) as VS Code has. For more info see [Contributing to Visual Studio Code > Prerequisites](https://github.com/microsoft/vscode/wiki/How-to-Contribute#prerequisites).

### Usage

Simply install our package into your extension `devDependencies` to get started:

```npm
npm install --save-dev vscode-extension-tester@latest
```

Make sure to check out the 🔗 [Documentation](#documentation) for detailed instructions.

- 📄 [How to set up the tests](../../wiki/Test-Setup)
- 📄 [Configuring Mocha](../../wiki/Mocha-Configuration)
- 📄 [An example simple test case](../../wiki/Writing-Simple-Tests)
- 📄 [Page objects API quick guide](../../wiki/Page-Object-APIs)

### Documentation

Our full documentation is located in 🔗 [GitHub Wiki](https://github.com/redhat-developer/vscode-extension-tester/wiki). Included are details about Page Objects API and how to setup Mocha tests information.

### Issues

Something is not working properly? In that case, feel free to 🔗 [open feature requests, report bugs, etc.](https://github.com/redhat-developer/vscode-extension-tester/issues)

### Get Involved

![Contribution Welcomed](https://img.shields.io/badge/welcomed-yellow.svg?style=for-the-badge&label=contribution)

If you'd like to help us get better, we appreciate it! Check out our 🔗 [Contribution Guide](CONTRIBUTING.md) on how to do that.

### Known Issues

We have prepared few answers for most common problems community reported. See 🔗 [Known Issues](KNOWN_ISSUES.md)
