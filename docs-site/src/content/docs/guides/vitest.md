---
title: Running Tests With Vitest (Experimental)
---

ExTester runs tests with [Mocha](/vscode-extension-tester/guides/mocha-configuration/) by default. As an experimental option, it can run them with [Vitest](https://vitest.dev/) instead. The page objects, `VSBrowser` and all ExTester options work the same way; only the test framework changes.

:::caution[Experimental]
The Vitest runner may change in minor releases. It does not support the [hidden window](/vscode-extension-tester/guides/hidden-window/) mode yet.
:::

## Setup

Install Vitest (5.0 or newer) next to ExTester:

```shell
npm install --save-dev vitest
```

Choose the runner on the command line:

```shell
extest setup-and-run './ui-test/**/*.test.ts' --test_runner vitest
```

or in `extester.config.json`:

```json
{
  "run": {
    "testRunner": "vitest",
    "testFiles": ["./ui-test/**/*.test.ts"]
  }
}
```

Vitest compiles TypeScript test files itself, so they need no build step and no `tsx`. Mocha is not needed for a Vitest run.

## Writing tests

Import the test API from `vitest` and the page objects from `vscode-extension-tester`:

```ts
import { beforeAll, describe, expect, it } from 'vitest';
import { ActivityBar } from 'vscode-extension-tester';

describe('ActivityBar', () => {
	let bar: ActivityBar;

	beforeAll(() => {
		bar = new ActivityBar();
	});

	it.each(['Explorer', 'Search'])('has the %s view', async (label) => {
		expect(await bar.getViewControl(label)).toBeDefined();
	});
});
```

Differences from Mocha tests:

- Use `beforeAll`/`afterAll` instead of `before`/`after`. The `before`/`after` wrappers exported by ExTester are for Mocha only; with Vitest, failed tests are screenshotted without them.
- Timeouts are options, not `this.timeout()`: `it('name', fn, 30_000)`. ExTester sets the defaults to 60 s per test and 120 s per hook unless your Vitest config sets `testTimeout`/`hookTimeout`.
- To run some tests only, set `EXTESTER_GREP` (or `MOCHA_GREP`) to a pattern of their full names.

## How it works

Vitest runs each test file in a worker process. VS Code is still started and stopped by the `extest` process, as in a Mocha run: once VS Code is up, ExTester passes its WebDriver session to the workers, and each worker drives the same window, so `VSBrowser.instance` and the page objects behave as usual. Test files run one after another, never in parallel, because there is a single VS Code window.

ExTester reads your Vitest configuration (`vitest.config.*` in the working directory, or the file given with `--vitest_config`) and adds its own setup file and settings on top. The test files are the ones ExTester was given, not Vitest's `include` patterns. Run the tests through `extest`, not with `vitest` directly: on its own, Vitest has no VS Code window to attach to.

Not supported yet:

- `--hidden_window`: restarting VS Code from a worker is not possible yet.
- `VSBrowser.instance.quit()` in a test: VS Code belongs to the `extest` process.
- The ExTester Runner extension still runs tests with Mocha.
