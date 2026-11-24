# Share the settings with your team

Put the Runner settings in the `runner` section of `extester.config.json`, next to the settings of the `extest` CLI. The VS Code version, type and storage folder come from `setup` and `run`, so they are defined once for both:

```json
{
  "$schema": "./node_modules/vscode-extension-tester/resources/extester.schema.json",
  "setup": { "vscodeVersion": "max", "type": "stable" },
  "runner": {
    "testFileGlob": "src/ui-test/**/*.test.ts",
    "rootFolder": "src",
    "outputFolder": "out",
    "preRunTask": "npm: compile",
    "env": { "TEST_USER": "tester" }
  }
}
```

Paths are relative to the file. Values from the file beat your user settings; workspace settings beat the file.
