---
title: Code Coverage
---

To generate a code coverage report using the [c8](https://github.com/bcoe/c8) tool, include the `-C` (or `--coverage`)
option when running tests via a CLI command
[`extest run-tests`](/vscode-extension-tester/guides/test-setup/#run-tests) or
[`extest setup-and-run`](/vscode-extension-tester/guides/test-setup/#set-up-and-run-tests).

Coverage can also be enabled with `"run": { "coverage": true }` in `extester.config.json` — see [Using a Config File](/vscode-extension-tester/guides/test-setup/#using-a-config-file).

## How coverage is collected

ExTester does not instrument your code. When coverage is enabled, the framework points Node's built-in [`NODE_V8_COVERAGE`](https://nodejs.org/api/cli.html#node_v8_coveragedir) at a temporary directory before VS Code starts, and every Node process launched from there — including the extension host that runs your extension — writes its raw V8 coverage into that directory when it exits. After the browser is closed, c8 converts those files into the report.

A few consequences follow from this:

- **Tests do not have to pass.** Coverage data is written at process exit regardless of the Mocha result, so failing tests still count for the code they ran.
- **Your extension has to activate.** Files that were never loaded do not appear in the report by default (`all: false`). If the report is empty or unexpectedly small, check that the tests trigger one of your `activationEvents`.
- **VS Code runs as an Extension Development Host**, with `--extensionDevelopmentPath` pointing at the directory you invoke `extest` from. The window title gets an `[Extension Development Host]` suffix, and when a VSIX is also installed (`-u`), the development copy takes precedence over it.
- **Source maps are needed** for the report to show your TypeScript sources; without them c8 reports the compiled JavaScript.

## Configuration Options

A configuration file can change the default behaviors of the c8 tool. The framework searches for c8 JSON configuration files named `.c8rc`, `.c8rc.json`, `.nycrc`, or `.nycrc.json`, starting from the directory you invoke `extest` from (`process.cwd()`), walking upwards. You can check out what options are supported in the [c8 documentation](https://github.com/bcoe/c8?tab=readme-ov-file#cli-options--configuration).

If no c8 JSON configuration file is provided, the following default
values will be used:

```typescript
const reportOptions: any = {
  reporter: ["text", "html"],
  all: false,
  excludeNodeModules: true,
  include: [],
  exclude: [
    "coverage/**",
    "packages/*/test{,s}/**",
    "**/*.d.ts",
    "test{,s}/**",
    "test{,-*}.{js,cjs,mjs,ts,tsx,jsx}",
    "**/*{.,-}test.{js,cjs,mjs,ts,tsx,jsx}",
    "**/__tests__/**",
    "**/{ava,babel,nyc}.config.{js,cjs,mjs}",
    "**/jest.config.{js,cjs,mjs,ts}",
    "**/{karma,rollup,webpack}.config.js",
    "**/.{eslint,mocha}rc.{js,cjs}",
  ],
  extension: [".js", ".cjs", ".mjs", ".ts", ".tsx", ".jsx"],
  excludeAfterRemap: false,
  skipFull: false,
  tempDirectory: this.targetDir,
  resolve: "",
  omitRelative: true,
  allowExternal: false,
};
```

where `this.targetDir` is a uniquely-named `vsc-coverage-<uuid>` directory created inside the system temp directory (`TMPDIR` on macOS/Linux, `TEMP`/`TMP` on Windows) and coverage reports are saved under `./coverage`, where the `c8` tool stores outputs by default.

## Notes on loading source files when code coverage is enabled

With code coverage enabled, there's no need to build a vsix
file as sources will be loaded directly from your
project directory during testing. By default the framework does not build or install a vsix file when code coverage enabled by the CLI `-C` (or `--coverage`) option.

However, in special situations where you need to load a vsix file in your test, for example, when you need to test the Extensions SideBar for installed extensions, add the `-u` (or `--uninstall_extension`) option.

When `-u` option is specified, the framework will build and install a vsix file prior to executing tests. After completing the test run, the framework uninstall the vsix file.
Keep in mind that even when using the `-u` option, source codes will still be sourced directly from your
project directory with code coverage enabled.

## Coverage of ExTester itself

If you are contributing to ExTester, the framework's own coverage is collected differently, as a byproduct of the Main CI test matrix, and is described in [CONTRIBUTING.md](https://github.com/redhat-developer/vscode-extension-tester/blob/main/CONTRIBUTING.md#coverage).
