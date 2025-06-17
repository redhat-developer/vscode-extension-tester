<h1 align="center">
  <img alt="ExTester for Visual Studio Code" width="75%" height="75%" src="./icons/logo-text-side.png">
</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/vscode-extension-tester"><img src="https://img.shields.io/npm/v/vscode-extension-tester?label=extester&color=orange&style=for-the-badge&logo=npm" alt="ExTester"/></a>
  <a href="https://www.npmjs.com/package/@redhat-developer/locators"><img src="https://img.shields.io/npm/v/@redhat-developer/locators?color=orange&label=locators&style=for-the-badge&logo=npm" alt="ExTester Locators"/></a>
  <a href="https://www.npmjs.com/package/@redhat-developer/page-objects"><img src="https://img.shields.io/npm/v/@redhat-developer/page-objects?color=orange&label=page%20objects&style=for-the-badge&logo=npm" alt="ExTester Page Objects"/></a>
  <a href="https://github.com/redhat-developer/vscode-extension-tester/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-Apache%202-yellow.svg?style=for-the-badge&logo=apache" alt="License"/></a>
  </br>
  <a href="https://github.com/prettier/prettier"><img src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=for-the-badge&logo=prettier" alt="Code styled by Prettier"></a>
  <a href="https://github.com/redhat-developer/vscode-extension-tester/actions/workflows/main.yml"><img src="https://img.shields.io/github/actions/workflow/status/redhat-developer/vscode-extension-tester/main.yml?label=Main%20CI&style=for-the-badge&logo=githubactions&logoColor=white" alt="Main CI"></a>
  <a href="https://github.com/redhat-developer/vscode-extension-tester/actions/workflows/insiders.yml"><img src="https://img.shields.io/github/actions/workflow/status/redhat-developer/vscode-extension-tester/insiders.yml?branch=main&label=Insider%20CI&style=for-the-badge&logo=githubactions&logoColor=white" alt="Insider CI"></a>
</p><br/>

<h2 align="center">UI Testing Framework for Visual Studio Code.</h2>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#requirements">Requirements</a> •
  <a href="#usage">Usage</a> •
  <a href="https://github.com/redhat-developer/vscode-extension-tester-example">Example</a> •
  <a href="https://github.com/redhat-developer/vscode-extension-tester/wiki/">Documentation</a> •
  <a href="#known-issues">Known Issues</a>
</p>

<p align="center">
<b>ExTester</b>: Your Essential UI Testing Companion for <a href="https://code.visualstudio.com/">Visual Studio Code</a> Extensions!<br>Seamlessly execute UI tests with <a href="https://www.npmjs.com/package/selenium-webdriver">Selenium WebDriver</a>, ensuring robustness and reliability in your extension development journey. Simplify UI testing for your VS Code extensions and elevate the quality of your user interface effortlessly. Dive into efficient testing with ExTester today!
</p><br/>

### Features

- ⬇️ Download a test instance of <b>Visual Studio Code</b>.
- ⬇️ Download the appropriate version of <b>ChromeDriver</b>.
- 📦 <b>Pack</b> and <b>Install</b> your extension into downloaded VS Code instance.
- 🚀 <b>Launch</b> the <b>VS Code</b> instance using Selenium WebDriver.
- 🔥 <b>Run</b> your <b>tests</b>.

### Requirements

| NodeJS                                                                                                                                                                                    | Visual Studio Code                                                                                                                              | Operating System                                                                                                                                                                                                  |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <table style="text-align:center;"> <tr><th>20.x.x</th><th>LTS</th><th>Latest</th></tr><tr><td>✅</td><td>✅❓</td><td>✅❓</td></tr><tr><td colspan="3">❓ Best-effort</td></tr> </table> | <table style="text-align:center;"> <tr><th>min</th><th>-</th><th>max</th></tr><tr><td>1.99.x</td><td>1.100.x</td><td>1.101.x</td></tr> </table> | <table style="text-align:center;"> <tr><th>Linux</th><th>Windows</th><th>macOS</th></tr><tr><td>✅ ⚠️</td><td>✅</td><td>✅ ⚠️</td></tr><tr><td colspan="3">⚠️ [Known Issues](KNOWN_ISSUES.md)</td></tr> </table> |

#### NodeJS Support Policy

ExTester is aiming same support for [NodeJS releases](https://nodejs.org/en/about/previous-releases) as **Visual Studio Code** and **Selenium WebDriver** have.

- For more info see [Contributing to Visual Studio Code > Prerequisites](https://github.com/microsoft/vscode/wiki/How-to-Contribute#prerequisites) and [Selenium > selenium-webdriver > Node Support Policy](https://github.com/SeleniumHQ/selenium/tree/trunk/javascript/node/selenium-webdriver#node-support-policy).

### Usage

Simply install our package into your extension `devDependencies` to get started:

```npm
npm install --save-dev vscode-extension-tester
```

Make sure to check out the 🔗 [Documentation](../../wiki) for detailed instructions.

- 📄 [How to set up the tests](../../wiki/Test-Setup)
- 📄 [Configuring Mocha](../../wiki/Mocha-Configuration)
- 📄 [An example simple test case](../../wiki/Writing-Simple-Tests)
- 📄 [Page objects API quick guide](../../wiki/Page-Object-APIs)

### Example

For an example project, check out the [Hello World Example](https://github.com/redhat-developer/vscode-extension-tester-example) repository, where you can find detailed setup and usage instructions.

### Documentation

Our full documentation is located in 🔗 [GitHub Wiki](../../wiki). Included are details about Page Objects API and how to setup Mocha tests information.

### Issues

Something is not working properly? In that case, feel free to 🔗 [open feature requests, report bugs, etc.](../../issues/new/choose)

### Get Involved

![Contribution Welcomed](https://img.shields.io/badge/welcomed-yellow.svg?style=for-the-badge&label=contribution)

If you'd like to help us get better, we appreciate it! Check out our 🔗 [Contribution Guide](CONTRIBUTING.md) on how to do that.

### Known Issues

We have prepared few answers for most common problems community reported. See 🔗 [Known Issues](KNOWN_ISSUES.md)
