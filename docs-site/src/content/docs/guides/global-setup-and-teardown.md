---
title: Global Setup and Teardown
---

ExTester starts a VS Code workbench before your tests run and shuts it down after they finish.
You can add your own Mocha global fixtures to prepare data, configure the workbench, or perform test run-wide cleanup.

## Fixture order

ExTester keeps the workbench available while your fixtures run:

| Phase           | Execution order                                                                                                    |
|-----------------|--------------------------------------------------------------------------------------------------------------------|
| Global setup    | ExTester starts VS Code and waits for the workbench, then your `globalSetup` fixtures run                          |
| Global teardown | Your `globalTeardown` fixtures run, then ExTester shuts down VS Code and cleans up (coverage, extension uninstall) |

Setup and teardown fixtures run sequentially, following Mocha's normal global fixture behavior.

## Failures

- If VS Code fails to start or one of your `globalSetup` fixtures throws, the remaining setup fixtures are skipped
  and the error is reported as a failure of the root `before all` hook, so no test runs.
  The global teardown still runs, and the run exits with code 1.
- If one of your `globalTeardown` fixtures throws, the error is logged, the remaining teardown fixtures still run,
  ExTester still shuts down VS Code, and the run exits with code 1.

## Configure Fixtures

Define your fixtures with the `globalSetup` and `globalTeardown` keys of a JavaScript Mocha configuration file. For example, `.mocharc.js`:

```js
module.exports = {
	globalSetup: async function() {
		// Prepare state shared by the test files
		console.log('Preparing test environment');
		this.server = await createServer();
	},
	globalTeardown: async function() {
		// Remove state shared by the test files
		console.log('Cleaning up test environment');
		await this.server.stop();
	},
};
```

The `globalSetup` and `globalTeardown` properties can be assigned a function or an array of functions.

> **Important:** Only the `globalSetup` and `globalTeardown` keys of a JavaScript `.mocharc` file are supported.
> ExTester creates Mocha programmatically and does not process the `require` option, so fixtures exported as
> `mochaGlobalSetup` / `mochaGlobalTeardown` from a module loaded with `--require` (as described in
> [Mocha's documentation](https://mochajs.org/#global-fixtures)) are silently ignored.

Global setup fixtures and global teardown fixtures share a `this` context, which means we can add properties
to the `this` object in the setup fixtures, and reference them later in the teardown fixtures.

## Disable Fixtures

Mocha's `enableGlobalSetup` and `enableGlobalTeardown` options control user-provided fixtures:

```js
module.exports = {
	enableGlobalSetup: false,
	enableGlobalTeardown: false,
};
```

Note that these options only skip global fixtures provided by your configuration,
while ExTester-provided fixtures for managing the workbench lifecycle will still run.
