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
// Mocha's BDD interface (the default): before, beforeEach, after and afterEach
import { before } from "vscode-extension-tester";

// Mocha's TDD interface (ui: "tdd"): suiteSetup, setup, suiteTeardown and teardown
import { suiteSetup } from "vscode-extension-tester";
```

Each hook registers Mocha's hook of the same kind for the interface that Mocha uses, so both sets of names work with either interface:

| BDD          | TDD             | Runs                               |
| ------------ | --------------- | ---------------------------------- |
| `before`     | `suiteSetup`    | once, before the tests of a suite  |
| `beforeEach` | `setup`         | before each test                   |
| `afterEach`  | `teardown`      | after each test                    |
| `after`      | `suiteTeardown` | once, after the tests of a suite   |

ExTester 8.29.0 and older have only the BDD names, and they work only with the BDD interface: with `ui: "tdd"` they fail with `ReferenceError: before is not defined`. With these versions, use Mocha's own TDD hooks; a failed hook then has no screenshot, but failed tests still have theirs.
