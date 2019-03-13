# vscode-extension-tester

VSCode Extension Tester is a package designed to help you run UI tests for your VS Code extensions using [selenium-webdriver](https://www.npmjs.com/package/selenium-webdriver). The main purpose is to automate all the necessary setup steps to launch webdriver tests:
 - Download a test instance of VS Code
 - Download the appropriate version of ChromeDriver
 - Package and install your extension into the VS Code instance 
 - Launch the VS Code instance using webdriver
 - Run your tests


Simply install it into your extension devDependencies to get started:
```
npm install --save-dev vscode-extension-tester
```


## Usage
The Extension Tester offers both CLI and API to perform all its actions. That way you can simply integrate it into your npm scripts, or just call it from your code if that is more prefferable. 

### Set up and Run Tests
#### Using the CLI
Below is the CLI reference for all available commands. All the available options for each command can be obtained by calling the command with an ```-h``` flag.
```
Usage: extest [options] [command]

VSCode Extension UI Test Runner

Options:
  -V, --version                        output the version number
  -h, --help                           output usage information

Commands:
  get-vscode [options]                 Download VSCode for testing
  get-chromedriver [options]           Download ChromeDriver binary
  install-vsix [options]               Install extension from vsix file into test instance of VSCode
  setup-tests [options]                Set up all necessary requirements for tests to run
  run-tests [options] <testFiles>      Run the test files specified by a glob pattern
  setup-and-run [options] <testFiles>  Perform all setup and run tests specified by glob pattern

```
As you can see, you have the option to run all the steps one by one. In this case you need to make sure all the consecutive commands use the correct flags by yourself. If you wish to run all the pre-test setup in one command, use the ```setup-tests``` command. To perform all the setup and run the tests, use the ```setup-and-run``` command.

```*Note:* By default, the downloaded resources will be saved into 'test-resources' folder in the extension root. Make sure the folder is being ignored by tsc (or tslint) and vsce to avoid build problems. If you decide to change this folder using the -s flag, make sure all consecutive commands use the same storage folder.```

#### Using the API
To use the API, simply import the ExTester class as follows:
```typescript
import { ExTester } from 'vscode-extension-tester'
```
The complete API reference is available below. It offers the same functionality as the CLI.
```typescript
/**
 * VSCode Extension Tester
 */
export declare class ExTester {
    private code;
    private chrome;
    constructor(storageFolder?: string);
    /**
     * Download VSCode of given version and release quality stream
     * @param version version to download, default latest
     * @param quality quality stream, only acceptable values are 'stable' and 'insider', default stable
     */
    downloadCode(version?: string, quality?: string): Promise<void>;
    /**
     * Install the extension into the test instance of VS Code
     * @param vsixFile path to extension .vsix file. If not set, default vsce path will be used
     */
    installVsix(vsixFile?: string): void;
    /**
     * Download the matching chromedriver for a given VS Code version
     * @param vscodeVersion selected versio nof VSCode, default latest
     * @param vscodeStream VSCode release stream, default stable
     */
    downloadChromeDriver(vscodeVersion?: string, vscodeStream?: string): Promise<void>;
    /**
     * Performs all necessary setup: getting VSCode + ChromeDriver
     * and packaging/installing extension into the test instance
     *
     * @param vscodeVersion version of VSCode to test against, default latest
     * @param vscodeStream whether to use stable or insiders build, default stable
     */
    setupRequirements(vscodeVersion?: string, vscodeStream?: string): Promise<void>;
    /**
     * Performs requirements setup and runs extension tests
     *
     * @param vscodeVersion version of VSCode to test against, default latest
     * @param vscodeStream whether to use stable or insiders build, default stable
     * @param testFilesPattern glob pattern for test files to run
     */
    setupAndRunTests(vscodeVersion: string | undefined, vscodeStream: string | undefined, testFilesPattern: string): Promise<void>;
    /**
     * Runs the selected test files in VS Code using mocha and webdriver
     * @param testFilesPattern glob pattern for selected test files
     */
    runTests(testFilesPattern: string): void;
}
```

### Writing the Tests
The Extension Tester integrates into the [Mocha](https://www.npmjs.com/package/mocha) test framework (other frameworks may be introduced in the future), as such requires Mocha 5.2.0 or newer to be used in your project.

To learn how to write tests using the Extension Tester, see the example test case below.
Two things to note here:
 - You do not need to start or quit the browser/driver, this is added automatically before and after the tests, respectively
 - Extension Tester exports all the [Webdriver APIs](https://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/), so you can use pure webdriver for all your tests by simply importing it
```typescript
// import the webdriver and the high level browser wrapper
import { VSBrowser, Webdriver } from 'vscode-extension-tester';

// Create a Mocha suite
describe('My Test Suite', () => {
  let browser: VSBrowser;
  let driver: WebDriver
  
  // initialize the browser and webdriver
  before(async () => {
    browser = VSBrowser.instance;
    driver = browser.driver;
  });
  
  // test whatever we want using webdriver
  it('My Test Case', async () => {
    const title = await driver.getTitle();
    assert.equals(title, 'whatever');
  });
});
```

