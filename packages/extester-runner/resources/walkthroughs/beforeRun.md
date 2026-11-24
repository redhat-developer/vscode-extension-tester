# Build before running, set environment variables

**Pre-run task** runs a VS Code task, as named in **Tasks: Run Task**, before every run. The tests start only when it ends successfully, so you never run stale tests:

```json
"extesterRunner.preRunTask": "npm: compile"
```

Use a task that ends, not a watch task. Combine several steps with a task that has `dependsOn` in `.vscode/tasks.json`.

**Environment variables** are passed to the tests. Only their names are logged:

```json
"extesterRunner.env": { "TEST_USER": "tester", "FEATURE_X": "on" }
```
