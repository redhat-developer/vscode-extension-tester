# Activity Bar View Container:

A new container titled **”ExTester Runner”** in the VS Code Activity Bar. This container hosts three custom tree views:

- UI Tests (Tree View ID: `extesterView`): Displays the UI test files and their test structure (Mocha `describe/it` blocks).
- Screenshots (Tree View ID: `extesterResourcesScreenshotsView`): Shows screenshot image files.
- Logs (Tree View ID: `extesterResourcesLogsView`): Shows log files from test runs.

# Commands:

The extension defines several commands (with their Command IDs), used in the UI and via the command palette:

- Refresh Tests – (`extester-runner.refreshTests`): Refreshes the UI Tests tree.
- Run All Tests – (`extester-runner.runAll`): Runs all test files in the workspace.
- Run Folder – (`extester-runner.runFolder`): Runs all tests in a specific folder.
- Run File – (`extester-runner.runFile`): Runs the tests in a single file.
- Refresh Screenshots – (`extester-runner.refreshScreenshots`): Refreshes the Screenshots tree.
- Refresh Logs – (`extester-runner.refreshLogs`): Refreshes the Logs tree.
- (Internal command) Open Test Item – (`extesterRunner.openTestItem`): Opens a test file in the editor at a specific line (used when user clicks a test in the tree). Similarly, the Logs and Screenshots trees likely use this or a similar internal command to open files.

# Tree View Features:

The UI Tests tree displays a hierarchical view of test files:

- Top level: Folders (only those containing matching test files, determined by a glob pattern).
- Next level: Test files (with an icon and label).
- Nested under each file: Test suites (`describe` blocks) and test cases (`it` blocks) parsed from the file.
- Each tree item uses icons and labels to indicate status:
  - “describe” blocks use a bracket icon. If marked `.only` or `.skip`, the icon or label changes (e.g., blue dot for `.only` orange (×) for `.skip`, and label text appends “[only]” or “[skip]” acc√o√©rdingly).
  - “it” blocks use a beaker/test-tube icon (or similar). They also reflect “[only]” or “[skip]” in labels and colored icons if applicable.
  - If a parent suite is skipped, its children appear in the skipped color (inheritance of modifiers).
- Clicking a file or test node opens the source file in the editor at the relevant line.
- If no test files are found, the tree shows a single info item “No tests found” with a warning icon.
- The Collapse All button is available for the UI Tests view (enabled only if there are items to collapse).

# The Logs tree displays log files organized in directories:

- Shows all folders and files under a designated logs directory (the location is determined by a Temp Folder setting or environment variable).
- Empty folders are shown but not expandable.
- Clicking a log file opens it in the editor (at line 0).
- If no logs are present, (planned: show an info message like “No logs” – this may be a TODO).
- A Collapse All and Refresh button exist (refresh reloads the log list).

# The Screenshots tree similarly shows screenshot image files (usually in a “screenshots” subdirectory of the test run output):

- Lists image files (possibly grouped in subfolders if present).
- Clicking an image opens the image preview in VS Code.
- If no screenshots exist, an info placeholder (“No screenshots”) is expected (marked as TODO).
- A Refresh button is available to manually reload screenshots.

# Settings (Configuration):

The extension contributes several settings under the namespace extesterRunner:

- `testFileGlob` (string): Glob pattern to find test files (default `**/ui-test/**/*.test.ts`).
- `excludeGlob` (string): Glob pattern of paths to exclude from test search (default `**/node_modules/**`).
- `ignorePathPart` (string): If set, any matching path segment is removed from folder labels in the UI Tests view (for cleaner display, e.g., remove common prefix paths).
- `additionalArgs` (string): Additional CLI arguments to pass to the test runner (`extest`) when executing tests (e.g., user-defined options).
- `outFolder` (string): Path to the compiled output directory for tests.
- `rootFolder` (string): Path to the test source root.
- `tempFolder` (string): Directory for test artifacts (logs, screenshots). If empty, the extension uses a default temp directory or an environment variable `TEST_RESOURCES`.
- `vsCodeVersion` (string): Which VS Code version to use for running tests (passed to the test runner CLI as `--code_version`, e.g., `"1.70.0"`).
- `vsCodeType` (string): Which VS Code build to use for tests (e.g., `"Insiders"` or `"Stable"`, passed as `--code_type`).

Changing any extesterRunner setting triggers a refresh of the test, logs, and screenshots views (the extension listens to configuration changes and refreshes accordingly).

# Tasks / Test Runner Integration:

The extension does not directly define new task types in `package.json`, but internally it uses the VS Code Task API to run tests via the `vscode-extension-teste` CLI (`extest`). Specifically:

- RunAllTestsTask (extends vscode.Task): Configured to run npx extest setup-and-run <outDir> [options] for all tests.
- RunFolderTask: Similar, but runs tests only under a specific folder path.
- RunFileTask: Runs tests from a single file. It calculates the output `.js` file path corresponding to the source `.ts` file (using `rootFolder/outFolder` settings and then runs `npx extest setup-and-run '<compiled-file-path>' [options]`.
- These tasks use `ShellExecution` to invoke the `extest` CLI and pass arguments based on the settings (e.g., `--storage <tempFolder>`for custom temp directory, `--code_version`, `--code_type`, and any extra `additionalArgs`). They ensure the task execution is awaited (using `vscode.tasks.executeTas` and listening for task completion) before allowing another run.

# Logging:

An output channel “ExTester Runner” is created on activation for logging information and debug messages. The extension’s `Logger` class wraps this channel to provide methods like `info`, `debug`, `error` (writing messages with appropriate formatting to the channel). These logs can help verify behavior (e.g., logs when tests start/finish, when files are discovered or refreshed, etc.).

# Walkthrough/Guide (Getting Started):

The extension contributes a “Get started with ExTester Runner” walkthrough with steps guiding the user to configure plugin. (While this is a feature, it likely doesn’t need automated testing beyond verifying its existence.)
