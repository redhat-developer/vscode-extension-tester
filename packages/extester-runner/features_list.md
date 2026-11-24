# Testing view integration

ExTester Runner contributes a test controller (`extesterRunner`, label **ExTester**) to VS Code's Testing view (`src/testing/testExplorer.ts`):

- Test items: folder (one per folder that contains test files) → file → `describe` block → `it` test. Item ids join the titles with `›` (never `\0`, which VS Code rejects).
- Discovery comes from `ExtesterTreeProvider` (glob search, file watching, configuration) and `listRunTargets` (`src/utils/runTargets.ts`), which parses `describe`/`it` blocks from the sources.
- Tests marked `.only`/`.skip` get `only`/`skip` as their description, and own or inherited modifiers as the tags `only`/`skip` (filter `@extesterRunner:only`). Files that contain `.only` get the description `.only`.
- One run profile, **Run** (default). `refreshHandler` refreshes discovery.
- The run handler creates one task per requested item (`RunFolderTask`, `RunFileTask`, `RunTestTask`), or one `RunAllTestsTask` per workspace folder when all tests run, and runs them one after another through `TestRunManager.startGroup` (one run at a time; a second run offers to stop the first).

# Per-test results

- `src/testing/resultHook.ts` (built to `out/resultHook.js`) is preloaded into the `extest` process with `NODE_OPTIONS=--require`. It hooks Mocha's runner and writes JSON lines (`started`, `passed`, `failed`, `skipped`, `output`) to the file named by `EXTESTER_RUNNER_RESULTS`. It does not change how the tests run.
- `src/testing/resultReader.ts` follows that file during the run.
- `src/testing/runReporter.ts` maps events to test items by their titles (`matchesTitles` in `src/utils/testGrep.ts`), reports output per test, and builds failure messages: diff of expected/actual, stack frames of the user's code, and a screenshot thumbnail. Failures are reported when the next test starts or the run ends, because ExTester takes the screenshot in an `afterEach` hook.
- Screenshots are looked up in the newest `<storage>/screenshots/<run>` folder written since the run started, named after the sanitized full title. The **Open Screenshot** action of the failure view (`extester-runner.openTestScreenshot`) opens the image.
- Tests without a result are marked skipped; if the run failed before any test (failed `preRunTask`, missing `extest`, invalid configuration), they are marked errored with the reason.

# Views

Contributed to the built-in Testing view container (`views.test`):

- Screenshots (`extesterResourcesScreenshotsView`): screenshot files, one folder per run, newest first.
- Logs (`extesterResourcesLogsView`): log files of the runs; empty folders hidden with `hideEmptyLogFolders`.

Both refresh on file changes and offer Refresh, Clear, Delete and Reveal in File Explorer.

# Commands

- `extester-runner.openWalkthrough`: opens the Getting Started walkthrough.
- `extester-runner.openTestScreenshot`: opens the screenshot of a failure message (failure view only).
- `extester-runner.refreshScreenshots`, `extester-runner.refreshLogs`: refresh the views.
- `extester-runner.clearScreenshots`, `extester-runner.clearLogs`: delete all screenshots or logs, with confirmation.
- `extester-runner.deleteScreenshotsItem`, `extester-runner.deleteLogsItem`: delete one item, with confirmation.
- `extester-runner.revealScreenshots`, `extester-runner.revealLogs`, `extester-runner.revealScreenshotsItem`, `extester-runner.revealLogsItem`: reveal in the OS file manager.

Running, stopping and rerunning tests use VS Code's own **Test:** commands.

# Settings (Configuration)

Settings live under `extesterRunner`: `testFileGlob`, `excludeGlob`, `ignorePathPart`, `runSources`, `rootFolder`, `outputFolder`, `tempFolder`, `visualStudioCode.Version`, `visualStudioCode.Type`, `additionalArgs`, `configFile`, `env`, `preRunTask`, `runCommand`, `hideEmptyLogFolders`.

Project configuration: the `runner` section of `extester.config.json` (read with the CLI's own loader, `extends` included) holds the shared values of `testFileGlob`, `excludeGlob`, `ignorePathPart`, `rootFolder`, `outputFolder`, `runSources`, `additionalArgs`, `env` and `preRunTask`; `visualStudioCode.Version`, `visualStudioCode.Type` and `tempFolder` come from `setup` / `run`. Precedence: defaults < user settings < file < workspace / workspace-folder settings. The file is read per workspace root, cached, and watched.

Changing a setting or the file refreshes discovery and the views.

# Tasks

Tests run in VS Code shell tasks (source `extester-runner`) that call `extest setup-and-run` with `ShellExecution`:

- `RunAllTestsTask`, `RunFolderTask`, `RunFileTask`: map sources from `rootFolder` to `outputFolder`, or with `runSources` pass the source file, `<folder>/<pattern>` or `<common folder>/**/<pattern>` (`src/tasks/testTarget.ts`).
- `RunTestTask`: runs one file and selects one `describe`/`it` with Mocha's `grep` in `MOCHA_GREP` (`src/utils/testGrep.ts`).
- Each task runs in the workspace root that owns the tests, with that root's configuration. Values from `extester.config.json` (VS Code version, type, storage) are not passed as CLI arguments; the CLI reads them from the file.
- All tasks pass `env`, and run the `preRunTask` VS Code task first, if set.

- With `runCommand` set, all tasks run that command instead of `npx extest setup-and-run`; `${target}` is replaced by the quoted target, or the target is appended (`src/utils/runCommand.ts`). Version, type, storage, `additionalArgs` and `--config` are not added. The result hook still works when the command keeps `NODE_OPTIONS` and `EXTESTER_RUNNER_RESULTS` for the Mocha process.

# Logging

The **ExTester Runner** output channel records discovery, runs and errors through the `Logger` class.

# Walkthrough

The **Get started with ExTester Runner** walkthrough (`extester-runner.gettingStarted`) covers the Testing view, the test file pattern and excluded paths, `extester.config.json`, compiled tests or TypeScript sources, `preRunTask` and `env`, running tests and reading results, and the remaining settings. The new steps use Markdown media in `resources/walkthroughs/`.
