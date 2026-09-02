# ExTester test project

`extester-test` is a small VS Code extension that exists only to test the ExTester framework itself. Its UI tests under `src/test/` exercise every page object, and the extension contributes the UI they need: tree views, web view views, a custom editor, commands, menus and settings.

It is a private workspace of this monorepo and is never published.

## Layout

| Path                                                                                        | Purpose                                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/extension.ts`, `src/treeView.ts`, `src/codelensProvider.ts`, `src/catScratchEditor.ts` | The extension under test                                                                                                                                                                                   |
| `src/test/<group>/`                                                                         | UI tests grouped by workbench area, one folder per CI job: `01_general`, `activityBar`, `bottomBar`, `cli`, `debug`, `dialog`, `editor`, `menu`, `statusBar`, `system`, `webview`, `workbench`, `xsideBar` |
| `src/test/customPageObjects/`                                                               | A custom page object and its locator contribution, loaded through the `customPageObjects` run option                                                                                                       |
| `src/test/testUtils.ts`                                                                     | Helpers shared by the tests                                                                                                                                                                                |
| `extester.config.json`                                                                      | Run configuration for all `test:*` scripts: installs extension dependencies, opens this folder as the workspace, fixes the order of the `cli` tests and registers the custom page objects                  |
| `extester.config.coverage.json`                                                             | The same run with code coverage enabled                                                                                                                                                                    |
| `resources/`, `media/`, `icons/`                                                            | Files opened or displayed by the tests                                                                                                                                                                     |

## Running the tests

From the repository root:

```bash
npm run test:build
```

builds the changed packages, installs the workspace and runs the whole suite. To run one group, use its script from the root or from this directory, for example:

```bash
npm run test:editor
```

`npm run test:coverage` runs the suite with c8 code coverage. Every script first runs `cb-init`, which copies `hello_ExTester` to the system clipboard for the clipboard tests, so expect your clipboard to change.

Set `CODE_VERSION` (for example `max`, `min` or `1.134.0`) and `CODE_TYPE` (`stable` or `insider`) to choose the VS Code build, exactly as the CI matrix does. See [Test Setup](https://redhat-developer.github.io/vscode-extension-tester/guides/test-setup/) for all options.

## Adding a test

Put new tests into the group that matches the UI area they cover, mirroring the page object they test. A new group needs a `test:<group>` script here and in the root `package.json`, plus a job in `.github/workflows/main.yml`. See the [Contribution Guide](../../CONTRIBUTING.md).
