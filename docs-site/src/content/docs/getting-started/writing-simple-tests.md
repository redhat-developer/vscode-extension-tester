---
title: Writing Simple Tests
---

ExTester is integrated with Mocha framework (as such requires Mocha 5.2+ to be present in your extension). To write a simple tests, one would write it just like a standard BDD Mocha test.

This is what a really simple test case might look like. Note that here we are only using pure webdriver. To use the provided page objects, see the [Page-Object-APIs](/vscode-extension-tester/objects/).

For an example project, check out the [vscode-extension-tester-example](https://github.com/redhat-developer/vscode-extension-tester-example) repository, where you can find detailed setup and usage instructions.

```typescript
import { assert } from "chai";
// import the webdriver and the high level browser wrapper
import { VSBrowser, WebDriver } from "vscode-extension-tester";

// Create a Mocha suite
describe("My Test Suite", () => {
  let browser: VSBrowser;
  let driver: WebDriver;

  // initialize the browser and webdriver
  before(async () => {
    browser = VSBrowser.instance;
    driver = browser.driver;
  });

  // test whatever we want using webdriver, here we are just checking the page title
  it("My Test Case", async () => {
    const title = await driver.getTitle();
    assert.equal(title, "whatever");
  });
});
```

## Project layout

A minimal setup keeps test sources in `src/ui-test/` and compiles them to `out/ui-test/` alongside the rest of your extension:

```
src/ui-test/example.test.ts   →   out/ui-test/example.test.js
```

Add an npm script that points `extest` at the compiled files:

```json
{
  "scripts": {
    "ui-test": "extest setup-and-run './out/ui-test/**/*.test.js'"
  }
}
```

Optionally, place a `.mocharc.js` in the project root to adjust Mocha defaults — the standard 2 second timeout is rarely enough for UI tests:

```javascript
module.exports = {
  timeout: 30000,
};
```

Instead of passing CLI flags in the npm script, options can also live in an `extester.config.json` file — see [Using a Config File](/vscode-extension-tester/guides/test-setup/#using-a-config-file).
