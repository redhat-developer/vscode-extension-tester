#### Stable VSCode
[![Main CI](https://github.com/redhat-developer/vscode-extension-tester/actions/workflows/main.yml/badge.svg)](https://github.com/redhat-developer/vscode-extension-tester/actions/workflows/main.yml)

#### Insider VSCode
[![Nightly Insiders](https://github.com/redhat-developer/vscode-extension-tester/actions/workflows/insiders.yml/badge.svg)](https://github.com/redhat-developer/vscode-extension-tester/actions/workflows/insiders.yml)

# vscode-extension-tester [![npm version](https://badge.fury.io/js/vscode-extension-tester.svg?style=flat)](https://badge.fury.io/js/vscode-extension-tester) [![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg?style=flat)](https://github.com/redhat-developer/vscode-extension-tester/blob/master/LICENSE)

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

## Migrating to 4.0

### ExTester API

In the 4.0 update, the `ExTester` API was revamped. If you are not using the API to launch your tests, no action is needed here.

The methods `setupRequirements`, `runTests` and `setupAndRunTests` have had their arguments changed from the long telescope list to structured objects.

The new signatures now involve `SetupOptions` and `RunOptions` objects respectively:
 - `setupRequirements(options: SetupOptions)`
 - `runTests(options: RunOptions)`
 - `setupAndRunTests(testFilesPattern: string, vscodeVersion: string = 'latest', setupOptions: SetupOptions, runOptions: RunOptions)` (though here the options don't include vscode version)

Both interfaces are exported and contain the list of options you would use as arguments in their respective methods. Any argument that used to have a default value is marked as optional in the interfaces.

### Changing Page Objects

A few page objects have had slight changes to their API. Others have had their inner workings changed that may influence tests with tight timeouts.

 - Context Menus now wait for all their items to load before you can manipulate them
   - this will not affect any APIs, but will slow down tests, so be careful if your test timeouts are tight
 - Settings Editor waits for the whole page to finish loading when searching for a setting
   - once again, test time is going to increase, care about timeouts
 - Action Bar & its items methods are now all asynchronous
   - `ActionBar` methods `getViewControl` and `getGlobalAction` are now async, make sure to await them
   - `ViewControl` and `ActionsItem` method `getTitle` is now async, make sure to await
   - `ViewControl` and `ActionsItem` contructors were changed to take a `WebElement` directly, instead of a title
     - hopefully, noone was using these directly, but if you do, use `ActionBar#getViewControl` or `getGlobalAction` instead to get the proper object


## Requirements

Extension Tester runs with all its features on Linux and Windows OSes.
MacOS support is limited, due to the title bar and context menus being native only, therefore unavailable for webdriver to handle.

In order to run the tests successfully you will need the following:
 - Nodejs 11 or newer

Building the native module also requires python and possibly a c/c++ compiler
 - GCC or similar for linux
 - MS Built Tools for windows
 - Xcode command line tools for macos

**NOTE:** Some Linux (CentOS-based) users have reported their tests getting stuck on launch. This is likely due to a missing dependency on ChromeDriver that runs underneath. If such a scenario occurs, we recommend installing the Chrome browser rpm, since it depends on all the required libraries.

## VS Code Version Support & Backward Compatibility

Extension Tester currently supports the latest 5 minor releases of VS Code (subject to change if VS Code 2.x ever comes out).

Additionally, the oldest release of VS Code that can be successfully used with Extension Tester is `1.37.0`. Older versions of VS Code might not work at all.

Versions older than the supported 5 latest releases, but still newer than `1.37.0` will most likely work just fine. However, if they stop working over time, there will be no more fixes to make them work. Unless you'd like to contribute these.

## Get Involved

If you'd like to help us get better, we appreciate it!

Check out our [Contribution Guide](CONTRIBUTING.md) on how to do that.
