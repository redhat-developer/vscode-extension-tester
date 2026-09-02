# ExTester Runner UI test fixture

This folder is a fixture project for the UI tests of the ExTester Runner extension (`packages/extester-runner/src/ui-test/`). The tests open it as a workspace and check that the **UI Tests** view discovers, parses and runs the files in `src/`.

It is not a template for your own project. For a complete, runnable example of an extension tested with ExTester, see the [vscode-extension-tester-example](https://github.com/redhat-developer/vscode-extension-tester-example) repository.

## Contents

| Path                   | Purpose                                                                                                                                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/parser/*.test.ts` | Mocha files of different shapes (simple, with `.only`/`.skip` modifiers, with variables, with several root `describe` blocks, deeply nested) that exercise the test tree parser             |
| `src/actions/*.test.ts` | Tests that take screenshots and produce a log by failing, so the **Screenshots** and **Logs** views have something to show                                                                 |
| `package.json`         | Dev dependencies (`vscode-extension-tester`, Mocha, Chai, TypeScript, ts-node) and a `build` script that runs `tsc`                                                                        |
| `tsconfig.json`        | Compiles `src/` to `out/`                                                                                                                                                                  |
| `.mocharc.json`        | Mocha defaults for the fixture: `ts-node`, a 120 second timeout, `src/**/*.test.ts`                                                                                                        |
| `.vscodeignore`        | Packaging ignore list, as in a real extension project                                                                                                                                      |

There is no `test` script. The files are executed by the ExTester Runner extension during its UI tests, not directly with Mocha.
