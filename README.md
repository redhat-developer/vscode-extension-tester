[![Build Status](https://travis-ci.org/redhat-developer/vscode-extension-tester.svg?branch=master)](https://travis-ci.com/redhat-developer/vscode-extension-tester)

# Breaking news
**3.0.0 contains an error that prevents it from being compiled without the native module. 3.0.1 fixes this, but native handlers are no longer part of the main API. You will need to import the native handling classes directly from vscode-extension-tester-native.**
Sorry about that.

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

## Migrating to 3.x

The `vscode-extension-tester` package still integrates the same way as in older versions, with one slight difference.

If you wish to use the native dialog handlers, you will need to install an additional module `vscode-extension-tester-native`. The appropriate classes will then still be exported from the main module to keep code compatibility.

One aim of 3.x is to provide a more convenient way of updating to new VS Code releases. The modular approach allows us to publish updates to packages like page objects or locators without updating the main module. If such an update occurs, you should get it on the next `npm install` in your project without making changes to your `package.json`. Unless your `package-lock.json` decides otherwise.

## Requirements

Extension Tester runs with all its features on Linux and Windows OSes.
MacOS support is limited, due to the title bar and context menus being native only, therefore unavailable for webdriver to handle.

In order to run the tests successfully you will need the following:
 - Nodejs 11 or newer

Building the native module also requires python and possibly a c/c++ compiler
 - GCC or similar for linux
 - MS Built Tools for windows
 - Xcode command line tools for macos

**NOTE:** Some Linux (CentOS based) users have reported their tests getting stuck on launch. This is likely due to a missing dependency of ChromeDriver that runs underneath. If such scenario occurs, we recommend installing the Chrome browser rpm, since it depends on all the required libraries.

## VS Code Version Support & Backward Compatibility

Extension Tester currently supports the latest 5 minor releases of VS Code (subject ot change if VS Code 2.x ever comes out).

Additionally, the oldest release of VS Code that can be successfully used with Extension Tester is `1.37.0`. Older versions of VS Code might not work at all. 

Versions older than the supported 5 latest releases, but still newer than `1.37.0` will most likely work just fine. However, if they stop working over time, there will be no more fixes to make them work. Unless you'd like to contribute these.

## Get Involved

If you'd like to help us get better, we appreciate it!

Check out our [Contribution Guide](CONTRIBUTING.md) on how to do that.

