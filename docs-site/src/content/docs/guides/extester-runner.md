---
title: ExTester Runner
---

![ExTester Runner](../../../assets/extester-runner.png)

## Quick Start

1. Install the ExTester Runner extension from the VS Code marketplace or the Open VSX Registry
2. Open your VS Code extension project
3. Open the **Testing** view and expand **ExTester**
4. Press the play button (▶️) next to a test, or next to a `describe` or `it` in the editor gutter

## What is ExTester Runner?

ExTester Runner is a VS Code extension that runs and manages the UI tests of a VS Code extension written with ExTester, without leaving VS Code.

It adds your tests to VS Code's built-in **Testing** view, under the **ExTester** test controller, and two views below the test tree in the same sidebar:

- **Screenshots**: the screenshots ExTester takes of failed tests, one folder per run
- **Logs**: the log files of the test runs

## How it Works

### Core Functionality

1. **Test Discovery**
   - Discovers the test files that match `testFileGlob` and lists them as folders, files, `describe` blocks and `it` tests
   - Parses Mocha's `describe` and `it` blocks from the sources, so the tree is ready before the tests are compiled
   - Shows `only` or `skip` next to tests marked with `.only` or `.skip`, and `.only` next to files that contain `.only`, which makes Mocha skip every other test in the run
   - Tags marked tests, so `@extesterRunner:only` or `@extesterRunner:skip` in the filter of the Testing view shows only them
   - Clicking a test opens its source at the `describe` or `it`
   - Refreshes the tree when test files are added, removed or changed, and when the settings or `extester.config.json` change. **Refresh Tests** in the Testing view refreshes it by hand

2. **Test Execution**
   - Runs everything, a workspace folder, a folder, a file, a `describe` block or a single `it` from the Testing view, or from the gutter buttons next to each `describe` and `it` in the editor
   - **Test: Run Tests in Current File**, **Test: Rerun Last Run**, run history and the other **Test:** commands of VS Code work as for any test controller
   - Stop a run with the stop button of the Testing view. Only one run starts at a time; starting another one offers to stop the current run
   - Each run calls `extest setup-and-run` in a VS Code task, with the VS Code version, release type and extra arguments from your settings. The task terminal shows the full output
   - Runs a build task before the tests with `preRunTask`, and passes environment variables to the tests with `env`; see [Build before running and environment variables](#build-before-running-and-environment-variables)

3. **Test Results**
   - Each test shows whether it passed, failed or was skipped, with its duration
   - A failure shows the error message, a diff of the expected and actual values when the assertion has them, and a stack trace whose frames open your test code
   - A failure also shows a thumbnail of the screenshot ExTester took of it. Click it, or **Open Screenshot** in the failure view, to open the full image
   - **Test Results** shows the output of the run, and the output each test wrote while it ran
   - When the run fails before any test starts, for example because `preRunTask` failed or `extest` is not installed, the tests are marked as errored with the reason

   The results come from a small hook that the Runner preloads into the `extest` process with `NODE_OPTIONS`. It listens to Mocha's events and copies the output to a temporary file that the Runner reads during the run. It does not change how the tests run. A test whose title is computed at run time, for example in a loop, may not match the parsed tree; it is then shown as skipped and its result is in the output.

4. **Logs and Screenshots Management**
   - The **Screenshots** and **Logs** views refresh when files are created, deleted or modified during a run
   - Displays screenshots and logs sorted newest-first so the latest run is always at the top
   - Timestamp-named run folders show a human-readable date/time label (e.g. `Jan 15, 2025, 14:30:22`) with the raw folder name as secondary text
   - **Clear all** — removes the entire contents of the Logs or Screenshots directory in one click (with confirmation)
   - **Delete individual item** — removes a single file or folder from either view (inline trash icon or right-click > Delete, with confirmation)
   - **Reveal in File Explorer** — opens the Logs or Screenshots root directory, or any individual item, in the OS file manager (Finder on macOS, Explorer on Windows)

### Configuration

The extension supports both VS Code settings and a [project configuration](#project-configuration) in `extester.config.json`. All setting IDs are prefixed with `extesterRunner.` when editing `settings.json` by hand (e.g. `extesterRunner.testFileGlob`):

1. **View Configuration**
   - `testFileGlob`: Pattern to locate test files (default: `**/ui-test/**/*.test.ts`)
   - `excludeGlob`: Pattern to exclude paths from test search (default: `**/node_modules/**`)
   - `ignorePathPart`: Path segment hidden from folder labels in the test tree

2. **Test Execution Settings**
   - `runSources`: Run the TypeScript test sources without compiling them; see [Running TypeScript Sources](#running-typescript-sources) (default: `false`)
   - `outputFolder`: Directory for compiled test files (default: `out`). Ignored when `runSources` is enabled
   - `rootFolder`: Root source directory for test files (default: not set). Ignored when `runSources` is enabled
   - `tempFolder`: Directory for temporary test files (default: not set — the system temporary folder is used)
   - `visualStudioCode.Version`: VS Code version for test execution — `max`, `min`, `latest`, or an exact version such as `1.97.1` (default: `max`)
   - `visualStudioCode.Type`: VS Code build type — `stable` or `insider` (default: `stable`)
   - `additionalArgs`: Additional CLI arguments for test runner (default: `[]`)
   - `configFile`: Path of the ExTester configuration file, relative to the workspace folder; see [Configuration file in a subfolder](#configuration-file-in-a-subfolder) (default: not set — `extester.config.json` in the workspace folder)
   - `env`: Environment variables for test runs (default: `{}`)
   - `preRunTask`: VS Code task to run before each test run, such as `npm: compile` (default: not set)
   - `runCommand`: Command that runs the tests instead of `npx extest setup-and-run`; see [Custom run command](#custom-run-command) (default: not set)

3. **Log Management**
   - `hideEmptyLogFolders`: Controls visibility of empty log directories (default: `true`)

## Setup and Configuration

### Project configuration

ExTester Runner reads shared project settings from `extester.config.json`, the same file that configures the [`extest` CLI](/vscode-extension-tester/guides/test-setup/). One file holds the settings of both tools, so the team does not have to commit `.vscode/settings.json`.

Put the Runner settings in the `runner` section, next to `setup` and `run`:

```json
{
  "$schema": "./node_modules/vscode-extension-tester/resources/extester.schema.json",
  "setup": { "vscodeVersion": "max", "type": "stable" },
  "run": { "mochaConfig": ".mocharc.js" },
  "runner": {
    "testFileGlob": "src/ui-test/**/*.test.ts",
    "rootFolder": "src",
    "outputFolder": "out",
    "ignorePathPart": "src/",
    "additionalArgs": []
  }
}
```

The `runner` section accepts `testFileGlob`, `excludeGlob`, `ignorePathPart`, `rootFolder`, `outputFolder`, `runSources`, `additionalArgs`, `env`, `preRunTask` and `runCommand`, with the same meaning as the settings in the [Configuration](#configuration) section. Unknown properties and invalid values are reported as configuration errors. The `$schema` reference gives completion and validation for the whole file. The CLI ignores the `runner` section.

The VS Code version, the release type and the storage folder are not repeated in `runner`. The Runner reads them from the CLI sections, in the same order as `extest setup-and-run`:

| Runner setting             | Read from                                 |
| -------------------------- | ----------------------------------------- |
| `visualStudioCode.Version` | `setup.vscodeVersion`, then `run.vscodeVersion` |
| `visualStudioCode.Type`    | `setup.type`, then `run.type`             |
| `tempFolder`               | `setup.storage`, then `run.storage`       |

Relative paths and globs in the file are relative to the folder of the file, as for the CLI. `extends` works as for the CLI: the Runner merges the base files in the same way. See [Using a Config File](/vscode-extension-tester/guides/test-setup/#using-a-config-file) for the rest of the format.

Settings are resolved per key in this order, from lowest to highest priority:

1. the extension's built-in default,
2. your **user** settings (global, apply to every project),
3. **`extester.config.json`** (shared with the team),
4. **workspace** and **workspace-folder** settings (e.g. `.vscode/settings.json`).

The shared file therefore beats personal global defaults, while workspace settings act as a local, per-project override: once `.vscode/settings.json` is no longer committed, every contributor can use it to adjust a value such as `tempFolder` or the VS Code version for themselves. When a workspace setting overrides a value from the file, the extension shows a one-time notice that names the setting.

When the VS Code version, type or storage folder comes from the file, the Runner does not pass `--code_version`, `--type` or `--storage`, and the CLI reads the value from the file itself. When a VS Code setting overrides it, the Runner passes the setting, and it wins over the file for that run.

Omitted properties keep the VS Code setting or its default. An empty array replaces the settings array; it does not append to it. Empty strings and `false` are also explicit values. Projects without `extester.config.json` keep using VS Code settings.

The extension watches the file and updates test discovery, views and file watchers when it is created, edited or deleted, without reloading VS Code. It does not watch base files that the file `extends`: after editing one, use **Refresh Tests** in the Testing view. An invalid file stops the test runs of its workspace folder, so they never run with fallback settings: their tests are marked as errored with the reported error. Fix it to continue. Running all tests still runs the tests of the other workspace folders.

#### Configuration file in a subfolder

By default, the Runner reads `extester.config.json` in the workspace root, where the CLI finds it too: the Runner starts `extest` in the workspace root. In a monorepo where the file is in a package folder, point the `extesterRunner.configFile` setting to it, relative to the workspace root:

```json
{
  "extesterRunner.configFile": "packages/ui-tests/extester.config.json"
}
```

The Runner then reads that file and passes it to `extest setup-and-run` with `--config`. The file must be inside the workspace folder. Do not also put `--config` in `additionalArgs`: the Runner reports that as an error. `configFile` is a VS Code setting only, because it tells the Runner where the file is.

#### Multi-root workspaces

In a multi-root workspace, each root has its own `extester.config.json` (or `extesterRunner.configFile` folder setting). Test discovery and the test runs use the configuration of the root that owns the tests, and run `extest` in that root. Running all tests runs the tests of each root separately, one root after another, and labels each task with the root name. Nested files are not discovered. The Logs and Screenshots views and their commands keep using the configuration of the first workspace folder.

#### Migrating from workspace settings

1. Move your shared `extesterRunner.*` values into the `runner` section of `extester.config.json`, without the `extesterRunner.` prefix. Move `visualStudioCode.Version`, `visualStudioCode.Type` and `tempFolder` to `setup.vscodeVersion`, `setup.type` and `setup.storage`.
2. If `additionalArgs` contains `--config`, set `extesterRunner.configFile` instead.
3. Remove the moved entries from `.vscode/settings.json`. Workspace settings take precedence over the file, so entries left behind keep overriding the shared values (the extension points this out with a notice). Then check test discovery and a test run.
4. If your project no longer needs to track any workspace settings, stop tracking that file and add `.vscode/settings.json` to `.gitignore`. Keep other shared `.vscode` files, such as extension recommendations and launch configurations, versioned.

The extension only reads `extester.config.json`. It does not write or migrate workspace settings.

### Initial Setup

The extension provides a built-in walkthrough to help you get started quickly. To open it, run **Welcome: Open Walkthrough...** from the Command Palette (Ctrl+Shift+P / Cmd+Shift+P) and pick **Get started with ExTester Runner**.

The walkthrough has these steps:

1. **Find Your Tests in the Testing View**: where the tests, their `only` and `skip` labels and the Screenshots and Logs views are
2. **Configure Test File Pattern**: the pattern that finds your test files (default: `**/ui-test/**/*.test.ts`)
3. **Configure Excluded Paths**: the paths left out of the search (default: `**/node_modules/**`)
4. **Share Settings in extester.config.json (Optional)**: the `runner` section of the [project configuration](#project-configuration)
5. **Choose Compiled Tests or TypeScript Sources**: the Root and Output folders of compiled tests, or Run Sources to run the `.ts` files (see [Running TypeScript Sources](#running-typescript-sources))
6. **Build and Set Environment Before Runs (Optional)**: `preRunTask` and `env`
7. **Run Tests and Read the Results**: running tests and reading their results, failures and screenshots
8. **Customize Path Display (Optional)**: hide a path segment from the folder labels of the test tree
9. **Additional Arguments (Optional)**: extra command line arguments for ExTester
10. **Additional Configuration Options**: the remaining ExTester Runner settings

### Manual Configuration

If you prefer to configure the extension manually, you can access all settings through VS Code's settings panel:

1. Open VS Code Settings (Ctrl+, / Cmd+,)
2. Search for "ExTester Runner"
3. Configure the settings listed in the [Configuration](#configuration) section above (prefixed `extesterRunner.*` when editing `settings.json` directly)

### Running a single test

Each `describe` block and `it` test has a play button in the Testing view and in the editor gutter. The Runner runs the file and passes the full title of the block to Mocha's `grep` option in the `MOCHA_GREP` environment variable, so only that block runs. Titles with template literal expressions, such as `` `works on ${platform}` ``, match any value of the expression.

### Build before running and environment variables

Set `preRunTask` to a VS Code task, as named in **Tasks: Run Task**, to run it before every test run, for example to compile the tests. The tests start only when the task ends successfully; if it fails or is not found, the tests are marked as errored with the reason. Use a task that ends, not a background (watch) task.

Set `env` to pass environment variables to the tests, for example account names or feature flags. Only the variable names are written to the ExTester Runner log.

```json
{
  "runner": {
    "preRunTask": "npm: compile",
    "env": { "TEST_USER": "tester" }
  }
}
```

### Custom run command

By default the Runner runs `npx extest setup-and-run <target>` with the arguments from its settings. Set `runCommand` to run your own command instead, for example an npm script that also starts a mock server, or `extest run-tests` when VS Code and ChromeDriver are already set up:

```json
{
  "runner": {
    "runCommand": "npm run ui-test -- ${target}"
  }
}
```

- `${target}` is replaced by the quoted path or glob of the tests to run: the test file, a glob of the files in a folder, or a glob of all test files. If the command has no `${target}`, the target is appended at the end.
- The command runs in the workspace folder and gets the `env` variables and, when a single test or `describe` block runs, `MOCHA_GREP`. `preRunTask` still runs first.
- The VS Code version, type, temp folder, `additionalArgs` and `configFile` are not added to the command. Put the options it needs in the command itself.

### Running TypeScript Sources

By default, ExTester Runner runs the compiled JavaScript tests. It maps the selected file or folder from `rootFolder` to `outputFolder`. For example, with `rootFolder` set to `src`, `src/ui-test/a.test.ts` runs as `out/ui-test/a.test.js`. You have to compile the tests before each run.

ExTester 8.29.0 and later can [load TypeScript tests](/vscode-extension-tester/guides/typescript-tests/) with `tsx`. To run the test sources without compiling them, enable `runSources`:

```json
{
  "runner": {
    "testFileGlob": "packages/ui-tests/src/**/*.test.ts",
    "runSources": true
  }
}
```

The example uses the `runner` section of `extester.config.json` (see [Project configuration](#project-configuration)); the `extesterRunner.testFileGlob` and `extesterRunner.runSources` settings work the same way. Runs then pass the sources to `extest setup-and-run` as they are and ignore `rootFolder` and `outputFolder`:

| Running    | Passes                                                              | Example                                     |
| ---------- | ------------------------------------------------------------------- | ------------------------------------------- |
| A file     | The file                                                            | `packages/ui-tests/src/editor/Flow.test.ts` |
| A folder   | The matching files directly in the folder                           | `packages/ui-tests/src/editor/*.test.ts`    |
| All tests  | The matching files below the deepest folder that contains all tests | `packages/ui-tests/src/**/*.test.ts`        |

The file pattern is the last segment of `testFileGlob`. The Runner passes absolute paths; the examples are relative to the workspace folder.

Requirements:

- `vscode-extension-tester` 8.29.0 or later.
- `tsx` that resolves from the workspace folder of the tests. The Runner starts `extest` in that folder, and ExTester resolves `tsx` from its working directory. In a monorepo, install `tsx` in the repository root, or let the package manager hoist it there.

The Runner does not check for `tsx` itself. If it is missing, ExTester reports it with install instructions before it downloads VS Code.

`tsx` does not type-check the tests, so keep a separate type check. The extension under test still has to be built as usual. See [Type checking and extension builds](/vscode-extension-tester/guides/typescript-tests/#type-checking-and-extension-builds).
