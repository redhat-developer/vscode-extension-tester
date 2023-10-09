VSCode Extension Tester is integrated with Mocha framework (as such requires Mocha 5.2+ to be present in your extension). To write a simple tests, one would write it just like a standard BDD Mocha test.

This is what a really simple test case might look like. Note that here we are only using pure webdriver. To use the provided page objects, see the [[Page-Object-APIs]].
```typescript
import { assert } from 'chai';
// import the webdriver and the high level browser wrapper
import { VSBrowser, WebDriver } from 'vscode-extension-tester';

// Create a Mocha suite
describe('My Test Suite', () => {
  let browser: VSBrowser;
  let driver: WebDriver
  
  // initialize the browser and webdriver
  before(async () => {
    browser = VSBrowser.instance;
    driver = browser.driver;
  });
  
  // test whatever we want using webdriver, here we are just checking the page title
  it('My Test Case', async () => {
    const title = await driver.getTitle();
    assert.equal(title, 'whatever');
  });
});
```
