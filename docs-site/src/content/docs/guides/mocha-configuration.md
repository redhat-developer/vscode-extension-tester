---
title: Mocha Configuration
---

Since this framework is using Mocha programmatically, we lose certain ways to configure the test runner. We do however support using mocha configuration files, with roughly the same functionality as described in [mochajs documentation](https://mochajs.org/#configuring-mocha-nodejs).

## Configuration Options

Extester supports three formats of mocha config files:

- javascript file (.js)
- json file (.json)
- yaml file (.yml | .yaml)

`.cjs` and `.mjs` config files are not supported — the runner only probes `.mocharc.js`, `.mocharc.json`, `.mocharc.yml` and `.mocharc.yaml`, and the `-m` flag only accepts `.js`, `.json`, `.yml` or `.yaml` files.

When using a JS file, make sure the options object is being exported as demonstrated [here](https://github.com/mochajs/mocha/blob/master/example/config/.mocharc.js).

You can check out what options are supported in the [Mocha API documentation](https://mochajs.org/api/mocha). Invalid option keys are ignored by Mocha. A config file passed explicitly with `-m` that cannot be parsed, or has an unsupported extension, fails the run with an error; an auto-discovered `.mocharc.*` file that cannot be parsed is skipped with a warning.

## Loading your Config File

By default, the framework is going to scan the root of your project for files named `.mocharc` with one of the supported extensions (as does Mocha). If multiple files are present, the priority then is `JS (.mocharc.js) > JSON (.mocharc.json) > YAML (.mocharc.yml, .mocharc.yaml)`.

Alternatively, you may use the `-m` flag with the command that runs your tests to specify a different path to your config file. For example

```sh
extest setup-and-run <test-files> -m <path/to/my/config.js>
```

The mocha config path can also be set via `run.mochaConfig` in `extester.config.json` — see [Using a Config File](/vscode-extension-tester/guides/test-setup/#using-a-config-file). Note that paths inside a config file resolve relative to the config file's directory, not the current working directory.

## Type-safe Configuration Files

If you wish to have your configuration type-checked, you can write the configuration in TypeScript using the `MochaOptions` interface. Make sure the .ts file is compiled, then use the `-m` flag to point to the compiled configuration.

An example config.ts file might look like this:

```typescript
import { MochaOptions } from "vscode-extension-tester";

const options: MochaOptions = {
  reporter: "spec",
  slow: 75,
  timeout: 2000,
  ui: "bdd",
};

export = options;
```

The compiled module must assign the options object directly to `module.exports` — a compiled `export default` wraps it in `{ default: ... }` and Mocha silently ignores everything.

## ENV variables for Mocha options

We are supporting only `MOCHA_GREP` and `MOCHA_INVERT` variables at the moment. It allows simpler overriding that options without need of modifying the Mocha config files.

```shell
# Run the test case whose name is "ExtensionsView"
MOCHA_GREP="ExtensionsView" npm run test

# Run the test cases whose name is NOT "ExtensionsView"
MOCHA_GREP="ExtensionsView" MOCHA_INVERT=true npm run test
```
