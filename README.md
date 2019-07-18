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
 - [An example simple test case](../../wiki/Writing-Simple-Tests)
 - [Page object APIs quick guide](../../wiki/Page-Object-APIs)
 
For the whole API reference, you can generate typedoc by running
```
npm run doc
```
The results can then be found in the 'docs' directory.
