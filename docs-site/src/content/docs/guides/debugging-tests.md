---
title: Debugging Tests
---

Attaching a debugger from VS Code can be achieved with a launch configuration such as this one:

```json
{
  "name": "Debug UI Tests",
  "type": "node",
  "request": "launch",
  "program": "${workspaceFolder}/node_modules/.bin/extest",
  "args": ["setup-and-run", "${workspaceFolder}/out/ui-test/*.js", "--mocha_config", "${workspaceFolder}/src/ui-test/.mocharc-debug.js"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

Sometimes Windows terminal has trouble interpreting the executable. If that happens, you can run the cli directly:

```json
{
  "name": "Debug UI Tests",
  "type": "node",
  "request": "launch",
  "program": "${workspaceFolder}/node_modules/vscode-extension-tester/out/cli.js",
  "args": ["setup-and-run", "${workspaceFolder}/out/ui-test/*.js", "--mocha_config", "${workspaceFolder}/src/ui-test/.mocharc-debug.js"],
  "console": "integratedTerminal",
  "runtimeExecutable": "node",
  "internalConsoleOptions": "neverOpen"
}
```

Change the `args` to fit your needs. Note the usage of `--mocha_config`, this is the supported way of globally changing test options. In this case, the important option is timeout (the default 2 second timeout is hardly enough to debug anything). The same options can also be supplied through `--config ./extester.config.json` — see [Using a Config File](/vscode-extension-tester/guides/test-setup/#using-a-config-file) — and adding `-l`/`--log_level` (e.g. `Debug`) gives you more verbose webdriver output while debugging.

We recommend using separate mocha configuration files for running, and debugging the tests, so you can globally control timeouts for each. Be aware that using per-test case timeout will override the global settings.

To learn more about mocha configuration, check [Mocha Configuration](/vscode-extension-tester/guides/mocha-configuration/).

An example debugging setup can be found in [vscode-extension-tester-example](https://github.com/redhat-developer/vscode-extension-tester-example).

## VS Code fails to launch

If VS Code exits before ChromeDriver can attach to it, the `before all` hook fails with a `SessionNotCreatedError`. ChromeDriver itself only says that the instance exited (`Chrome instance exited`, or on Windows `Chrome failed to start: crashed`), so ExTester adds what VS Code left behind to the error message:

- **VS Code output**: ChromeDriver runs with `--enable-chrome-logs`, so everything the VS Code process printed is written to `chromedriver.log` in the storage folder. The lines printed during the failed launch are repeated in the error.
- **VS Code main log**: the tail of `<storage>/settings/logs/<session>/main.log`, if VS Code got far enough to write one.
- **Crash dumps**: any new files in `<storage>/crashes`.

On Windows, ChromeDriver reports almost any non-zero exit code as `crashed`. It usually means VS Code refused to start, not that it hit a native crash, so check the VS Code output above before changing GPU or sandbox settings. Common causes are:

- A VS Code instance from a previous run still uses the same storage folder. Close leftover Code and ChromeDriver processes.
- The VS Code binary is incomplete or blocked, for example by antivirus software or a missing execute permission.
- On Windows, the runner has no interactive desktop session or is missing the Visual C++ runtime. On Linux, system libraries or a display (for example Xvfb) are missing.

ExTester removes `ELECTRON_RUN_AS_NODE` and `ELECTRON_NO_ATTACH_CONSOLE` from the environment it launches VS Code with. Either variable, inherited for example from a process started by another VS Code or Electron app, would stop VS Code from starting as a browser.
