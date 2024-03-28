# Hello World ExTester

This is a Hello World example extension that shows you how to set up and run simple UI tests for VS Code extensions using the ExTester.

## Motivation

Our example extension gives us the ability to call the `Hello World` command, one that shows a notification saying `Hello World!`. We would like to write automated regression tests for this feature.

![demo](./demo.gif)

## Dependencies and Requirements

In order to run the ExTester, the extension needs 2 packages as (dev)Dependencies:

- `vscode-extension-tester` - the extension testing framework itself
- `mocha` - Mocha test framework is required, as the ExTester uses it for writing and running its tests

This example also uses `chai` as the assertion framework of choice, but feel free to use any assertion package you like.

Also note that the folder `test-resources` (which stores all the required binaries for testing) is excluded from typescript compiler and ESLint. This is necessary for both to work when building your project. We also recommend adding the folder into your `.gitignore` file.

## Running the Tests

- Run `npm install` in terminal to install dependencies
- Run `npm run ui-test` in terminal. This will:
  - Compile the code
  - Download the latest version of VS Code
  - Download the adequate version of ChromeDriver
  - Run the downloaded VS Code binary using ChromeDriver
  - Run the tests located in `src/ui-test`

To check the `ui-test` script, see the `script` section inside `package.json`.
To check the test code, see the `src/ui-test/*-test.ts` files.
