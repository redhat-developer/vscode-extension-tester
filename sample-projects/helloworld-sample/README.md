# Hello World Sample

This is a Hello World sample extension that shows you how to set up and run simple UI tests for VS Code extensions using the extension tester.

## Motivation

Our sample extension gives us the ability to call the `Hello World` command, one that shows a notification saying 'Hello World!'.

![demo](demo.gif)

We would like to write automated regression tests for this feature.


## Dependencies and Requirements

In order to run the extension tester, the extension needs 2 packages as (dev)Dependencies:
 - `vscode-extension-tester` - the extension testing framework itself
 - `mocha` - Mocha test framework is required, as the extension tester uses it for writing and running its tests

This sample also uses `chai` as the assertion framework of choice, but feel free to use any assertion package you like.

Also note that the folder `test-resources` (which stores all the required binaries for testing) is excluded from typescript compiler and ESLint. This is necessary for both to work when building your project. We also recommend adding the folder into your `.gitignore` file.


## Running the Sample

- Run `npm install` in terminal to install dependencies
- Run `npm run ui-test` in terminal. This will:
	- Compile the code
	- Download the latest version of VSCode
	- Download the adequate version of chromedriver
	- Run the downloaded VSCode binary using chromedriver
	- Run the tests located in `src/ui-test`

To check the `ui-test` script, see the `script` section inside `package.json`.
To check the test code, see the `src/ui-test/hello-world-test.ts` file.