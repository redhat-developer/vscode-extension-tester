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
determined by calling `this.currentTest.fullTitle()` — characters that are invalid in file names (such as `/` or `:` in test titles) are stripped. This feature does not apply to Mocha
hooks by default. In order to capture screenshots on failed hooks, one
must import vscode-extension-tester hook.

```typescript
// Supported hooks: before, beforeEach, after and afterEach
import { before } from "vscode-extension-tester";
```

These hooks call Mocha's `before`, `beforeEach`, `after` and `afterEach`, which only Mocha's default BDD interface defines. With Mocha's TDD interface (`ui: "tdd"`), calling them fails with `ReferenceError: before is not defined`: use Mocha's `suiteSetup`, `setup`, `suiteTeardown` and `teardown` instead. A failed hook then has no screenshot; failed tests still have theirs.
