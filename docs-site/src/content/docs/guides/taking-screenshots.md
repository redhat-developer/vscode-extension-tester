---
title: Taking Screenshots
---

It is possible to take screenshots when testing Visual Studio Code extensions.
Screenshot can be captured by calling:

```typescript
await VSBrowser.instance.takeScreenshot(basename: string)
```

Captured screenshots will be saved to `<test-storage>/screenshots/<run-timestamp>/`, where `<run-timestamp>` is a `YYYYMMDDTHHMMSS` stamp for the current run. The default test storage folder is `$TMPDIR/test-resources`; override it with the `TEST_RESOURCES` environment variable.
File name will be generated from given basename in the following format: `${basename}.png`.

## Mocha integration

Tester takes screenshots on all failed test cases. Screenshot name is
determined by calling `this.currentTest.fullTitle()` — characters that are invalid in file names (such as `/` or `:` in test titles) are stripped.

It also takes a screenshot when a hook fails, before Mocha goes on, named after the titles of the hook's suites and the hook, for example `Editor.before each hook open file for saves.png`. This works for every hook of your test files, with Mocha's own hook functions and nothing to import: `before`, `beforeEach`, `afterEach` and `after` with Mocha's default BDD interface, `suiteSetup`, `setup`, `teardown` and `suiteTeardown` with its TDD interface (`ui: "tdd"`), and the hooks of the other interfaces. A hook that skips its tests with `this.skip()` takes no screenshot.

ExTester 8.29.0 and older take a screenshot of a failed hook only for the hooks imported from `vscode-extension-tester`:

```typescript
// Supported hooks: before, beforeEach, after and afterEach
import { before } from "vscode-extension-tester";
```

These imports keep working and are no longer needed. They now also work with the TDD interface, where they register Mocha's `suiteSetup`, `setup`, `suiteTeardown` and `teardown`; in 8.29.0 and older they fail there with `ReferenceError: before is not defined`. Their callbacks have the types of Mocha's hook callbacks, so `this` is Mocha's context without a `this: Mocha.Context` annotation, and a callback can take Mocha's `done`.
