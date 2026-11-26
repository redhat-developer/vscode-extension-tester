# More settings

| Setting                    | What it does                                                                            |
| -------------------------- | --------------------------------------------------------------------------------------- |
| `visualStudioCode.Version` | VS Code version to test with: `max` (default), `min`, `latest` or an exact version.     |
| `visualStudioCode.Type`    | `stable` (default) or `insider`.                                                        |
| `tempFolder`               | Folder for the downloaded VS Code, ChromeDriver, screenshots and logs.                  |
| `runCommand`               | Your own command instead of `npx extest setup-and-run`, such as `npm run ui-test -- ${target}`. |
| `configFile`               | Path of `extester.config.json` when it is not in the workspace folder.                  |
| `hiddenWindow`             | **Experimental.** Run the tests in a VS Code window that is never shown or focused (VS Code 1.147+). |
| `hideEmptyLogFolders`      | Hide log folders without files in the **Logs** view (default: on).                      |

All settings start with `extesterRunner.`. Values in `extester.config.json` beat your user settings, and workspace settings beat the file.

The **ExTester Runner** output channel logs test discovery, runs and errors.
