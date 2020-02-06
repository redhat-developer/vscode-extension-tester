[![Build Status](https://travis-ci.com/redhat-developer/vscode-extension-tester.svg?branch=master)](https://travis-ci.com/redhat-developer/vscode-extension-tester)

# vscode-extension-tester

VSCode Extension Tester is a package designed to help you run UI tests for your VS Code extensions using [selenium-webdriver](https://www.npmjs.com/package/selenium-webdriver). 

The first part is to automate all the necessary setup steps to launch webdriver tests:
 - Download a test instance of VS Code
 - Download the appropriate version of ChromeDriver
 - Package and install your extension into the VS Code instance 
 - Launch the VS Code instance using webdriver
 - Run your tests

The second part is to provide an extendable page object API for more convenient test writing. 

## Usage

Simply install it into your extension devDependencies to get started:
```
npm install --save-dev vscode-extension-tester
```

Make sure to check out the [wiki](../../wiki) for detailed instructions.
 - [How to set up the tests](../../wiki/Test-Setup)
 - [Configuring Mocha](../../wiki/Mocha-Configuration)
 - [An example simple test case](../../wiki/Writing-Simple-Tests)
 - [Page object APIs quick guide](../../wiki/Page-Object-APIs)
 
For the whole API reference, you can generate typedoc by running
```
npm run doc
```
The results can then be found in the 'docs' directory.

## Requirements

Extension Tester runs with all its features on Linux and Windows OSes.
MacOS support is limited, due to the title bar and context menus being native only, therefore unavailable for webdriver to handle.

In order to run the tests successfully you will need the following:
 - Nodejs 11 or newer

Building the project will also require a c/c++ compiler
 - GCC or similar for linux
 - MS Built Tools for windows
 - Xcode command line tools for macos

**NOTE:** Some Linux (CentOS based) users have reported their tests getting stuck on launch. This is likely due to a missing dependency of ChromeDriver that runs underneath. If such scenario occurs, we recommend installing the Chrome browser rpm, since it depends on all the required libraries.

## Get Involved

If you'd like to help us get better, we appreciate it!

Check out our [Contribution Guide](CONTRIBUTING.md) on how to do that.

