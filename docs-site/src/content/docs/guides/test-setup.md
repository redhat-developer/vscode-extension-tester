---
title: Test Setup
---

The ExTester offers both CLI and API to perform all the setup actions. That way you can simply integrate it into your npm scripts, or just call it from your code if that is more preferable.

## Useful ENV variables

- `CODE_VERSION` - can be used to set version of VS Code you want to run with the appropriate ChromeDriver version

  ```shell
  export CODE_VERSION="1.133.0"
  ```

  See [Supported Versions](/vscode-extension-tester/getting-started/supported-versions/) for the versions ExTester provisions — `1.90.0` is the hard floor.

- `TEST_RESOURCES` - can be used to set folder used for all test resources, by default `$TMPDIR/test-resources` (value of `$TMPDIR` differs based on operating system)

  ```shell
  export TEST_RESOURCES="./test-folder"
  ```

- `HTTP_PROXY` - route http requests through a proxy when downloading VS Code and ChromeDriver (see also `HTTPS_PROXY`).
- `HTTPS_PROXY` / `NO_PROXY` - proxy for the https downloads of VS Code and ChromeDriver, and the usual no-proxy exception list.
- `EXTENSIONS_FOLDER` - configuring the [extension path](https://code.visualstudio.com/docs/configure/extensions/extension-marketplace#_where-are-extensions-installed) where extensions are installed/loaded.
- `EXTENSION_DEV_PATH` - The [developer extension](https://vscode-docs.readthedocs.io/en/stable/extensions/debugging-extensions/) that is loaded under development.
- `HTTPS_TLS_REJECT_UNAUTHORIZED` - Disable TLS check when downloading VSCode and Chromium driver. '0' is disabled and '1' is enabled, this setting aligns with [`NODE_TLS_REJECT_UNAUTHORIZED`](https://nodejs.org/api/cli.html#node_tls_reject_unauthorizedvalue).

  ```shell
  export HTTPS_TLS_REJECT_UNAUTHORIZED="0"
  ```

- `CODE_TYPE` - release stream to use when `-t`/`--type` is not passed; `insider` selects the insider stream, anything else selects stable.
- `MOCHA_GREP` / `MOCHA_INVERT` - override Mocha's `grep`/`invert` for the run without touching the mocharc file (`MOCHA_INVERT` applies only for the exact string `"true"`).

## Using the CLI

All the CLI actions are available with the command `extest` which is available to your npm scripts once the package is installed. The default storage folder for all test resources is a `$TMPDIR/test-resources`.

### Download VS Code

If you wish to manually download VS Code of a given version

```shell
Usage: extest get-vscode [options]

Download VS Code for testing

Options:
  -s, --storage <storage>       # Use this folder for all test resources
  -c, --code_version <version>  # Version of VS Code to download; use `min`/`max` for the oldest/latest version supported by ExTester
  -t, --type <type>             # Type of VS Code release (stable/insider)
  -n, --no_cache                # Disable caching of VS Code download (default: false)
  --config <path>               # Path to extester.config.json configuration file
  -h, --help                    # output usage information
```

### Download ChromeDriver

Download chrome driver for a given version of VS Code

```shell
Usage: extest get-chromedriver [options]

Download ChromeDriver binary

Options:
  -s, --storage <storage>       # Use this folder for all test resources
  -c, --code_version <version>  # Version of VS Code to download; use `min`/`max` for the oldest/latest version supported by ExTester
  -t, --type <type>             # Type of VS Code release (stable/insider)
  -n, --no_cache                # Disable caching of ChromeDriver download (default: false)
  --config <path>               # Path to extester.config.json configuration file
  -h, --help                    # display help for command
```

### Build and Install Extension from vsix

To manually build and install your extension. This step is not necessary to run the tests — `setup-tests` and `setup-and-run` package and install the extension for you. Use it when you need to install a prebuilt or downloaded `.vsix` instead.

```shell
Usage: extest install-vsix [options]

Install extension from vsix file into test instance of VS Code

Options:
  -s, --storage <storage>                      # Use this folder for all test resources
  -e, --extensions_dir <extensions_directory>  # VS Code will use this directory for managing extensions
  -f, --vsix_file <file>                       # path/URL to vsix file containing the extension
  --package_options <json>                     # JSON string of vsce IPackageOptions (e.g. '{"useYarn":true,"followSymlinks":true}')
  -t, --type <type>                            # Type of VS Code release (stable/insider)
  -i, --install_dependencies                   # Automatically install extensions your extension depends on (default: false)
  --config <path>                              # Path to extester.config.json configuration file
  -h, --help                                   # display help for command

```

### Install Extensions from Marketplace

To also install arbitrary extensions by ID into your test instance.

```shell
Usage: extest install-from-marketplace [options] <id> [ids...]

Install extension from marketplace with given <id> into test instance of VS Code

Options:
  -s, --storage <storage>                      # Use this folder for all test resources
  -e, --extensions_dir <extensions_directory>  # VS Code will use this directory for managing extensions
  -t, --type <type>                            # Type of VS Code release (stable/insider)
  -p, --pre_release                            # Installs the pre-release version of the extension
  --config <path>                              # Path to extester.config.json configuration file
  -h, --help                                   # display help for command
```

### Perform All Test Setup

To perform all test setup steps in one command

```shell
Usage: extest setup-tests [options]

Set up all necessary requirements for tests to run

Options:
  -s, --storage <storage>                      # Use this folder for all test resources
  -e, --extensions_dir <extensions_directory>  # VS Code will use this directory for managing extensions
  -c, --code_version <version>                 # Version of VS Code to download; use `min`/`max` for the oldest/latest version supported by ExTester
  -t, --type <type>                            # Type of VS Code release (stable/insider)
  -o, --code_settings <settings.json>          # Path to custom settings for VS Code json file, applied before setup-phase CLI steps
  --package_options <json>                     # JSON string of vsce IPackageOptions (e.g. '{"useYarn":true,"followSymlinks":true}')
  -i, --install_dependencies                   # Automatically install extensions your extension depends on (default: false)
  -n, --no_cache                               # Disable caching of VS Code and ChromeDriver downloads (default: false)
  --config <path>                              # Path to extester.config.json configuration file
  -h, --help                                   # display help for command
```

### Run Tests

To run test files

```shell
Usage: extest run-tests [options] [testFiles...]

Run the test files specified by glob pattern(s)

Options:
  -s, --storage <storage>                      # Use this folder for all test resources
  -e, --extensions_dir <extensions_directory>  # VS Code will use this directory for managing extensions
  -c, --code_version <version>                 # Version of VS Code to download; use `min`/`max` for the oldest/latest version supported by ExTester
  -t, --type <type>                            # Type of VS Code release (stable/insider)
  -o, --code_settings <settings.json>          # Path to custom settings for VS Code json file
  --code_keybindings <keybindings.json>        # Path to a custom keybindings.json file (JSONC array) seeded into the test instance
  --code_snippets <folder>                     # Path to a folder of snippet files seeded into the test instance's User/snippets
  -u, --uninstall_extension                    # Uninstall the extension after the test run (default: false)
  -m, --mocha_config <mocharc.js>              # Path to Mocha configuration file
  -l, --log_level <level>                      # Log messages from webdriver with a given level (default: "Info")
  -f, --offline                                # Attempt to run without internet connection, make sure to have all requirements downloaded (default: false)
  -C, --coverage                               # Enable code coverage using c8
  -L, --locale <locale>                        # Launch VS Code with the given display language (e.g. ru, zh-cn). Requires the matching language pack extension to already be installed. See the Locale Testing guide.
  -r, --open_resource <resources...>           # Open resources in VS Code. Multiple files and folders can be specified.
  -p, --custom_page_objects <path>             # Path to a compiled JS locator contribution file for custom page objects
  --config <path>                              # Path to extester.config.json configuration file
  -h, --help                                   # display help for command
```

### Set up and Run Tests

Perform all test setup and run tests in a single command

```shell
Usage: extest setup-and-run [options] [testFiles...]

Perform all setup and run tests specified by glob pattern(s)

Options:
  -s, --storage <storage>                      # Use this folder for all test resources
  -e, --extensions_dir <extensions_directory>  # VS Code will use this directory for managing extensions
  -c, --code_version <version>                 # Version of VS Code to download; use `min`/`max` for the oldest/latest version supported by ExTester
  -t, --type <type>                            # Type of VS Code release (stable/insider)
  -o, --code_settings <settings.json>          # Path to custom settings for VS Code json file
  --code_keybindings <keybindings.json>        # Path to a custom keybindings.json file (JSONC array) seeded into the test instance
  --code_snippets <folder>                     # Path to a folder of snippet files seeded into the test instance's User/snippets
  --package_options <json>                     # JSON string of vsce IPackageOptions (e.g. '{"useYarn":true,"followSymlinks":true}')
  -u, --uninstall_extension                    # Uninstall the extension after the test run (default: false)
  -m, --mocha_config <mocharc.js>              # Path to Mocha configuration file
  -i, --install_dependencies                   # Automatically install extensions your extension depends on (default: false)
  -l, --log_level <level>                      # Log messages from webdriver with a given level (default: "Info")
  -f, --offline                                # Attempt to run without internet connection, make sure to have all requirements downloaded (default: false)
  -C, --coverage                               # Enable code coverage using c8
  -r, --open_resource <resources...>           # Open resources in VS Code. Multiple files and folders can be specified.
  -n, --no_cache                               # Disable caching of VS Code and ChromeDriver downloads (default: false)
  -L, --locale <locale>                        # Launch VS Code with the given display language (e.g. ru, zh-cn). Requires the language pack to be installed via -i. See the Locale Testing guide.
  -p, --custom_page_objects <path>             # Path to a compiled JS locator contribution file for custom page objects
  --config <path>                              # Path to extester.config.json configuration file
  -h, --help                                   # display help for command
```

## How custom settings propagate

The file passed via `-o`/`--code_settings` (or `run.settings` in the config file) is parsed as JSONC — comments and trailing commas are accepted, exactly as VS Code itself accepts them in `settings.json` — so you can pass a copy of your own settings file directly. The root must be a JSON object.

Before launch, ExTester merges your settings **on top of** its own framework defaults and writes the result to `<storage>/settings/User/settings.json` (user scope). Your values win on every key. The merge is one level deep: an object-valued setting in your file replaces the framework's value whole rather than merging into it. These are the injected defaults:

| Setting                                          | Value                           | Why the framework sets it                                                                                                                                |
| ------------------------------------------------ | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `update.mode` / `update.showReleaseNotes`        | `none` / off                    | A mid-run self-update corrupts the instance under test                                                                                                   |
| `extensions.autoUpdate` / `autoCheckUpdates`     | off                             | Same — extension state must not change mid-run                                                                                                           |
| `window.titleBarStyle`                           | `custom`                        | TitleBar/menu page objects only work with the custom title bar                                                                                           |
| `window.menuStyle`                               | `custom` (VS Code ≥ 1.101 only) | TitleBar/menu page objects only work with the custom title bar; the setting does not exist before VS Code 1.101                                          |
| `window.dialogStyle`                             | `custom`                        | ModalDialog page objects (incl. the dirty-editor discard) need it                                                                                        |
| `workbench.reduceMotion`                         | `on`                            | Disables UI animations that make element waits environment-dependent                                                                                     |
| `workbench.hover.delay`                          | 7 days                          | Workbench tooltips are DOM overlays that appear while the WebDriver pointer rests on the last click point, never auto-hide, and intercept the next click |
| `editor.stickyScroll.enabled`                    | `false`                         | The sticky-scroll overlay eats clicks aimed at the top editor lines                                                                                      |
| `files.simpleDialog.enable`                      | `true`                          | Open/save dialog page objects need the simple (in-window) dialog                                                                                         |
| `security.workspace.trust.enabled`               | `false`                         | Trust prompts would block the first window                                                                                                               |
| `workbench.editor.enablePreview`                 | `false`                         | Editor tests assume real tabs, not preview tabs                                                                                                          |
| `workbench.startupEditor` + welcome/walkthroughs | none/off                        | A deterministic empty workbench at startup                                                                                                               |
| `window.commandCenter`                           | `false`                         | Keeps the title bar layout the page objects expect                                                                                                       |
| `window.restoreFullscreen`                       | `true`                          | Deterministic window state across runs                                                                                                                   |
| `window.newWindowDimensions`                     | `maximized`                     | Deterministic window geometry across runs                                                                                                                |
| `terminal.integrated.copyOnSelection`            | `true`                          | Terminal page objects read output via the selection clipboard                                                                                            |
| `workbench.secondarySideBar.defaultVisibility`   | `hidden`                        | Keeps the workbench layout the page objects expect                                                                                                       |
| `workbench.editor.useModal`                      | `off`                           | Keeps editor prompts as dialogs the framework can handle                                                                                                 |

Overriding one of these is allowed but prints a warning with the old → new values, since several of them are load-bearing for the page objects.

Two things outrank your settings file:

1. **Always-on launch flags.** ExTester starts VS Code with `--disable-updates`, `--disable-workspace-trust`, `--disable-telemetry`, `--disable-experiments` and `--skip-welcome`, and CLI flags win over `settings.json`. A setting that tries to re-enable one of these (e.g. `"security.workspace.trust.enabled": true`) has no effect; ExTester prints a warning when it detects this.
2. **Workspace settings.** Your file is written at _user_ scope. Any folder or workspace you open — via `-r`/`--open_resource` or `VSBrowser.openResources()` — that carries its own `.vscode/settings.json` shadows your value for the keys it defines, per VS Code's normal precedence. This is the classic "my setting worked until the window reloaded" trap: opening a folder reloads the window, and the folder's workspace settings take over — while the user-scope file on disk still shows your value. ExTester prints a warning naming the shadowed keys when this happens.

Custom settings are applied at launch. To change a setting mid-test, use the `SettingsEditor` page object.

Keybindings and snippets can be seeded the same way: `--code_keybindings <keybindings.json>` copies a JSONC keybindings file (array root, comments preserved) into the test instance, and `--code_snippets <folder>` copies a folder of snippet files (`<language>.json` or `*.code-snippets`) into `User/snippets`. Seeding matters because ExTester wipes the settings directory on every start for determinism — only `languagepacks.json` is preserved (it is written by the extension-install step and needed for locale testing), so files placed there manually do not survive. If the wipe hits a busy directory (a leftover process from a previous run), ExTester retries once and then fails with a clear error instead of continuing with mixed state.

`setup-tests` also accepts `-o`/`--code_settings` (config: `setup.settings`): the parsed settings are written before setup-phase CLI steps run, so settings such as `http.proxy` apply to marketplace extension installs. `setup-and-run` reuses the run-phase settings for its setup phase automatically.

One practical note on the storage folder: the settings dir doubles as VS Code's `--user-data-dir`, which hosts an IPC socket whose path must fit the OS socket limit (~104 bytes on macOS, ~108 on Linux). ExTester fails fast with a clear error if your storage path is too deep — use a shorter `-s`/`--storage` or `TEST_RESOURCES` if you hit it.

## Using a Config File

Instead of repeating long CLI flag sequences, you can define all options in an `extester.config.json` file at the root of your project. ExTester automatically discovers it by walking up from the current working directory.

### Quick start

Create `extester.config.json` next to your `package.json`:

```json
{
  "setup": {
    "vscodeVersion": "latest",
    "installDependencies": true
  },
  "run": {
    "testFiles": ["./out/test/**/*.test.js"],
    "resources": ["."],
    "extensionsDir": "./test-extensions"
  }
}
```

Then replace your npm script:

```jsonc
// Before
"ui-test": "extest setup-and-run './out/test/**/*.test.js' -i -r . -e ./test-extensions"

// After
"ui-test": "extest setup-and-run"
```

### Config file discovery

ExTester searches for `extester.config.json` by walking up the directory tree from `cwd` (the same strategy used by `.mocharc.json` and similar tools). The first file found is used. Unlike the VS Code `settings.json` you pass with `-o`, `extester.config.json` is parsed as strict JSON — comments and trailing commas are rejected.

To point to a specific file instead:

```shell
extest setup-and-run --config ./config/extester.config.json
```

The `--config` path must resolve inside the current working directory or the system temp directory and must end in `.json`. To share a config that lives above your package (e.g. a monorepo root), use `extends` instead — extended paths are not restricted to the working directory.

### Extending config files

A config file can inherit from one or more base config files via the top-level `extends` field — useful for sharing one base config across packages in a monorepo while overriding only what differs (e.g. the `testFiles` globs):

```json
// <repo root>/extester.base.json
{
  "setup": { "vscodeVersion": "latest", "installDependencies": true },
  "run": { "logLevel": "Info" }
}
```
```json
// packages/my-extension/extester.config.json
{
  "extends": "../../extester.base.json",
  "run": { "testFiles": ["./out/test/**/*.test.js"] }
}
```

Merge rules:

- `extends` accepts a single path or an array of paths (relative or absolute). Relative paths resolve against the directory of the file that declares them.
- With multiple bases, later entries override earlier ones, and the extending file overrides all of its bases.
- Objects are deep-merged; **arrays and scalars are replaced whole, not concatenated** — setting `testFiles` in an extending file fully replaces the base's globs.
- Relative paths _inside_ each config file resolve against that file's own directory, so a base config's `storage` or `testFiles` stay anchored to the base file's location.
- Chains are allowed (a base may itself extend another file); circular chains are reported as an error.
- The `extends` field never appears in the effective config.

### Precedence

Settings are resolved in this order — later sources override earlier ones:

```
built-in defaults  ←  extended base configs (in order)  ←  extester.config.json  ←  CLI flags
```

Boolean options are an exception: a `true` in the config file cannot be switched off from the command line (`installDependencies`, `noCache`, `cleanup`, `offline` are OR-ed with their CLI flags). Remove the value from the config file to disable it.

Environment variables (`CODE_VERSION`, `TEST_RESOURCES`, etc.) continue to apply at their existing layer inside ExTester and are not affected by the config file.

### Config file reference

All fields are optional. Paths are resolved relative to the config file's location. The top-level `extends` field is described in [Extending config files](#extending-config-files).

#### `setup` section

Controls VS Code + ChromeDriver download and extension installation. Used by `get-vscode`, `get-chromedriver`, `install-vsix`, `setup-tests`, and `setup-and-run`.

| Field                 | Type                      | Default                                       | CLI equivalent                  | Description                                                                                                |
| --------------------- | ------------------------- | --------------------------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `vscodeVersion`       | string                    | `"latest"`                                    | `-c` / `--code_version`         | VS Code version: `latest`, `min`, `max`, or `1.X.Y`                                                        |
| `type`                | `"stable"` \| `"insider"` | `"stable"`                                    | `-t` / `--type`                 | VS Code release stream                                                                                     |
| `storage`             | string                    | `$TEST_RESOURCES` or `$TMPDIR/test-resources` | `-s` / `--storage`              | Folder for all downloaded test resources                                                                   |
| `extensionsDir`       | string                    | —                                             | `-e` / `--extensions_dir`       | VS Code extensions directory override                                                                      |
| `packageOptions`      | object                    | —                                             | `--package_options`             | vsce `IPackageOptions` forwarded to `vsce.createVSIX()`                                                    |
| `settings`            | string                    | —                                             | `-o` / `--code_settings`        | Custom `settings.json` applied before setup-phase CLI steps (e.g. proxy settings for marketplace installs) |
| `installDependencies` | boolean                   | `false`                                       | `-i` / `--install_dependencies` | Install marketplace dependencies automatically                                                             |
| `noCache`             | boolean                   | `false`                                       | `-n` / `--no_cache`             | Skip cached downloads                                                                                      |

#### `run` section

Controls test execution inside VS Code. Used by `run-tests` and `setup-and-run`.

| Field               | Type                      | Default                                       | CLI equivalent                 | Description                                                                                                                                                                                                    |
| ------------------- | ------------------------- | --------------------------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `testFiles`         | string[]                  | —                                             | positional `[testFiles...]`    | Glob pattern(s) for test files. Used when no CLI positional args are provided.                                                                                                                                 |
| `vscodeVersion`     | string                    | `"latest"`                                    | `-c` / `--code_version`        | VS Code version: `latest`, `min`, `max`, or `1.X.Y`                                                                                                                                                            |
| `type`              | `"stable"` \| `"insider"` | `"stable"`                                    | `-t` / `--type`                | VS Code release stream                                                                                                                                                                                         |
| `storage`           | string                    | `$TEST_RESOURCES` or `$TMPDIR/test-resources` | `-s` / `--storage`             | Folder for all downloaded test resources                                                                                                                                                                       |
| `extensionsDir`     | string                    | —                                             | `-e` / `--extensions_dir`      | VS Code extensions directory override                                                                                                                                                                          |
| `settings`          | string                    | —                                             | `-o` / `--code_settings`       | Path to a custom VS Code `settings.json`. See [How custom settings propagate](#how-custom-settings-propagate)                                                                                                  |
| `keybindings`       | string                    | —                                             | `--code_keybindings`           | Custom `keybindings.json` (JSONC array) seeded into the test instance                                                                                                                                          |
| `snippets`          | string                    | —                                             | `--code_snippets`              | Folder of snippet files seeded into the test instance's `User/snippets`                                                                                                                                        |
| `cleanup`           | boolean                   | `false`                                       | `-u` / `--uninstall_extension` | Uninstall the extension after the test run                                                                                                                                                                     |
| `mochaConfig`       | string                    | —                                             | `-m` / `--mocha_config`        | Path to a Mocha configuration file                                                                                                                                                                             |
| `logLevel`          | string                    | `"Info"`                                      | `-l` / `--log_level`           | Webdriver and ChromeDriver log level: `Debug`, `Info`, `Warning`, `Severe`, `OFF`, `ALL` (`ALL` records the full CDP wire traffic in `chromedriver.log` and can grow it by hundreds of MB over a long session) |
| `offline`           | boolean                   | `false`                                       | `-f` / `--offline`             | Run without internet access                                                                                                                                                                                    |
| `coverage`          | boolean                   | `false`                                       | `-C` / `--coverage`            | Enable c8 code coverage                                                                                                                                                                                        |
| `resources`         | string[]                  | `[]`                                          | `-r` / `--open_resource`       | Files or folders to open in VS Code at startup                                                                                                                                                                 |
| `customPageObjects` | string                    | —                                             | `-p` / `--custom_page_objects` | Path to a compiled JS locator contribution file                                                                                                                                                                |
| `locale`            | string                    | —                                             | `-L` / `--locale`              | Display language locale (e.g. `ru`, `zh-cn`). Requires the language pack extension to be installed. See [Locale Testing](/vscode-extension-tester/guides/locale-testing/)                                                                                     |

### Editor autocomplete

Add a `$schema` field to get inline validation and autocomplete in VS Code and other JSON-aware editors:

```json
{
  "$schema": "./node_modules/vscode-extension-tester/resources/extester.schema.json",
  "setup": { ... },
  "run": { ... }
}
```

Validation happens in the editor only — at runtime unknown or mistyped fields are ignored rather than reported, so a typo'd key silently has no effect.

### Caching Behavior

The ExTester implements a caching mechanism for both VS Code and ChromeDriver downloads to improve performance and reduce bandwidth usage. Here's how it works:

#### Default Caching Behavior

1. **Resource Caching**:
   - When downloading, archives are saved with version-specific names (e.g., `1.133.0-stable.zip` for VS Code, `142.0.7444.60-chromedriver-win64.zip` for ChromeDriver)
   - Before downloading, the system checks if a matching version exists in the cache
   - If found in cache, the download is skipped and the cached archive is unpacked
   - The archive is preserved for future use

#### Using --no_cache

When the `--no_cache` option is enabled:

1. **Resource Behavior**:
   - Always downloads a fresh copy of the archive
   - Saves it with a generic filename (e.g., `stable.zip` for VS Code, `chromedriver-win64.zip` for ChromeDriver)
   - After unpacking, the downloaded archive is removed
   - Note: If a version is already unpacked, it will be reused even with --no_cache to avoid unnecessary unpacking

> **NOTE:** `Unpacked` refers to the extracted VS Code and ChromeDriver executables that are ready to run, stored separately from their downloaded archives. This is a critical distinction to understand when working with ExTester's caching system.

## Using the API

The same actions are available in the `ExTester` class as API:

### `packageOptions` / `--package_options`

The `packageOptions` field (and its CLI counterpart `--package_options <json>`) accepts any option
from the `IPackageOptions` interface of [`@vscode/vsce`](https://github.com/microsoft/vscode-vsce).
The object is forwarded directly to `vsce.createVSIX()`, so every packaging option vsce supports
is available without ExTester needing to enumerate them individually.

Common examples:

```typescript
// Use yarn instead of npm
{ useYarn: true }

// Use yarn without dependency detection (vsce's --yarn --no-dependencies,
// e.g. for yarn/npm workspaces or fully bundled extensions)
{ useYarn: true, dependencies: false }

// Recurse into symlinked directories (fixes missing-symlink issues)
{ followSymlinks: true }

// Combine options freely
{ useYarn: true, followSymlinks: true, preRelease: true }
```

CLI equivalent:

```shell
extest setup-and-run 'out/**/*.test.js' --package_options '{"useYarn":true,"followSymlinks":true}'
```
```typescript
export interface SetupOptions {
  /** version of VS Code to test against, defaults to latest */
  vscodeVersion?: string;
  /** vsce packaging options passed directly to vsce.createVSIX() */
  packageOptions?: IPackageOptions;
  /** path to a custom settings json file applied before setup-phase CLI steps (e.g. proxy settings for marketplace installs) */
  settings?: string;
  /** install the extension's dependencies from the marketplace. Defaults to `false`. */
  installDependencies?: boolean;
  /** disable caching of VS Code and ChromeDriver downloads */
  noCache?: boolean;
}
export declare const DEFAULT_SETUP_OPTIONS: {
  vscodeVersion: string;
  installDependencies: boolean;
};

export interface RunOptions {
  /** version of VS Code to test against, defaults to latest */
  vscodeVersion?: string;
  /** path to custom settings json file */
  settings?: string;
  /** remove the extension's directory as well (if present) */
  cleanup?: boolean;
  /** path to a custom mocha configuration file */
  config?: string;
  /** logging level of the Webdriver */
  logLevel?: logging.Level;
  /** try to perform all setup without internet connection, needs all requirements pre-downloaded manually */
  offline?: boolean;
  /** list of resources to be opened by VS Code */
  resources: string[];
  /** custom page objects locator contribution to load at startup */
  customPageObjects?: CustomPageObjectsOptions;
  /** display language locale for VS Code (e.g. 'ru', 'zh-cn'). Requires the matching language pack extension to be installed. */
  locale?: string;
  /** path to a custom keybindings.json file (JSONC array) seeded into the test instance */
  keybindings?: string;
  /** path to a folder of snippet files seeded into the test instance's User/snippets */
  snippets?: string;
}

export interface CustomPageObjectsOptions {
  /** path to a compiled JS module exporting a `locators` object in LocatorDiff shape */
  locatorsPath: string;
}
/** defaults for the RunOptions */
export declare const DEFAULT_RUN_OPTIONS: {
  vscodeVersion: "latest";
  settings: "";
  logLevel: logging.Level.INFO;
  offline: false;
  resources: never[];
  noCache: false;
};

/**
 * ExTester
 */
export declare class ExTester {
  private code;
  private chrome;
  constructor(storageFolder?: string, releaseType?: ReleaseQuality, extensionsDir?: string, coverage?: boolean);
  /**
   * Download VS Code of given version and release quality stream
   * @param version version to download, default latest
   * @param noCache download a fresh copy without using or writing the cache
   */
  downloadCode(version?: string, noCache?: boolean): Promise<void>;
  /**
   * Install the extension into the test instance of VS Code
   * @param vsixFile path/URL/glob to extension .vsix file. If not set, the extension is packaged with vsce
   * @param packageOptions vsce IPackageOptions passed directly to vsce.createVSIX()
   * @param installDependencies also install the extension's marketplace dependencies
   */
  installVsix({ vsixFile, packageOptions, installDependencies }?: {
    vsixFile?: string;
    packageOptions?: IPackageOptions;
    installDependencies?: boolean;
  }): Promise<void>;
  /**
   * Install an extension from VS Code marketplace into the test instance
   * @param id id of the extension to install
   * @param preRelease install the pre-release version of the extension
   */
  installFromMarketplace(id: string, preRelease?: boolean): Promise<void>;
  /**
   * Download the matching chromedriver for a given VS Code version
   * @param vscodeVersion selected version of VS Code, default latest
   * @param noCache download a fresh copy without using or writing the cache
   * @returns path to the downloaded ChromeDriver binary
   */
  downloadChromeDriver(vscodeVersion?: string, noCache?: boolean): Promise<string>;
  /**
   * Performs all necessary setup: getting VS Code + ChromeDriver
   * and packaging/installing extension into the test instance
   *
   * @param options Additional options for setting up the tests
   * @param offline whether to run in offline mode
   * @param cleanup whether to clean up after tests
   */
  setupRequirements(options?: SetupOptions, offline?: boolean, cleanup?: boolean): Promise<void>;
  /**
   * Performs requirements setup and runs extension tests
   *
   * @param testFilesPattern glob pattern(s) for test files to run
   * @param vscodeVersion version of VS Code to test against, defaults to latest
   * @param setupOptions Additional options for setting up the tests
   * @param runOptions Additional options for running the tests
   *
   * @returns Promise resolving to the mocha process exit code - 0 for no failures, 1 otherwise
   */
  setupAndRunTests(
    testFilesPattern: string | string[],
    vscodeVersion?: string,
    setupOptions?: Omit<SetupOptions, "vscodeVersion">,
    runOptions?: Omit<RunOptions, "vscodeVersion">,
  ): Promise<number>;
  /**
   * Runs the selected test files in VS Code using mocha and webdriver
   * @param testFilesPattern glob pattern(s) for test files to run
   * @param runOptions Additional options for running the tests
   *
   * @returns Promise resolving to the mocha process exit code - 0 for no failures, 1 otherwise
   */
  runTests(testFilesPattern: string | string[], runOptions?: RunOptions): Promise<number>;
}

/**
 * Resolves the effective VS Code version. The `CODE_VERSION` environment variable wins over the argument;
 * `min`/`max` resolve to the oldest/newest version ExTester is tested against.
 */
export declare function loadCodeVersion(version: string | undefined): string;
export declare const DEFAULT_STORAGE_FOLDER: string;
export declare const VSCODE_VERSION_MIN: string;
export declare const VSCODE_VERSION_MAX: string;
```

Note that `CODE_VERSION` overrides the version passed to the API or CLI rather than acting as a fallback — when the environment variable is set, it wins.
