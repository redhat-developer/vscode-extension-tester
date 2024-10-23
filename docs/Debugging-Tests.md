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

Change the `args` to fit your needs. Note the usage of `--mocha_config`, this is the supported way of globally changing test options. In this case, the important option is timeout (the default 2 second timeout is hardly enough to debug anything).

We recommend using separate mocha configuration files for running, and debugging the tests, so you can globally control timeouts for each. Be aware that using per-test case timeout will override the global settings.

To learn more about mocha configuration, check [[Mocha-Configuration]].

An example debugging setup can be found in [vscode-extension-tester-example](https://github.com/redhat-developer/vscode-extension-tester-example).
