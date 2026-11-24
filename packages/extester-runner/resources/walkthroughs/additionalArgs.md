# Pass more options to ExTester

**Additional Arguments** are appended to every `extest setup-and-run` call, one array item per argument:

```json
"extesterRunner.additionalArgs": ["--mocha_config", ".mocharc.js", "--log_level", "Debug"]
```

The runner already passes the test files, the VS Code version and type, the storage folder, and `--config` when `configFile` is set. Do not repeat them here.

To share the arguments with your team, put them in the `runner` section of `extester.config.json`, or move the options to its `setup` and `run` sections, which the `extest` CLI reads itself.

See all options in [Set Up and Run Tests](https://redhat-developer.github.io/vscode-extension-tester/guides/test-setup/#set-up-and-run-tests).
