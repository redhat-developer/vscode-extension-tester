The ExTester offers both CLI and API to perform all the setup actions. That way you can simply integrate it into your npm scripts, or just call it from your code if that is more preferable.

## Useful ENV variables

- `CODE_VERSION` - can be used to set version of VS Code you want to run with the appropriate ChromeDriver version

  ```shell
  export CODE_VERSION="1.84.2"
  ```

- `TEST_RESOURCES` - can be used to set folder used for all test resources, by default `$TMPDIR/test-resources` (value of `$TMPDIR` differs based on operating system)

  ```shell
  export TEST_RESOURCES="./test-folder"
  ```

- `HTTP_PROXY` - can be used to route http request over a prox for downloading VSCode and Chromium driver.
- `EXTENSIONS_FOLDER` - configuring the [extension path](https://code.visualstudio.com/docs/configure/extensions/extension-marketplace#_where-are-extensions-installed) where extensions are installed/loaded.
- `EXTENSION_DEV_PATH` - The [developer extension](https://vscode-docs.readthedocs.io/en/stable/extensions/debugging-extensions/) that is loaded under development.
- `HTTPS_TLS_REJECT_UNAUTHORIZED ` - Disable TLS check when downloading VSCode and Chromium driver. '0' is disabled and '1' is enabled, this setting aligns with [`NODE_TLS_REJECT_UNAUTHORIZED`](https://nodejs.org/api/cli.html#node_tls_reject_unauthorizedvalue).

  ```shell
  export HTTPS_TLS_REJECT_UNAUTHORIZED="0"
  ```

## Using the CLI

All the CLI actions are available with the command `extest` which is available to your npm scripts once the package is installed. The default storage folder for all test resources is a `$TMPDIR/test-resources`.

### Download VS Code

If you wish to manually download VS Code of a given version

```shell
Usage: extest get-vscode [options]

Download VS Code for testing

Options:
  -s, --storage <storage>       # Use this folder for all test resources
  -c, --code_version <version>  # Version of VS Code to download
  -t, --type <type>             # Type of VS Code release (stable/insider)
  -n, --no_cache                # Disable caching of VS Code download (default: false)
  -h, --help                    # output usage information
```

### Download ChromeDriver

Download chrome driver for a given version of VS Code

```shell
Usage: extest get-chromedriver [options]

Download ChromeDriver binary

Options:
  -s, --storage <storage>       # Use this folder for all test resources
  -c, --code_version <version>  # Version of VS Code you want to run with the ChromeDriver
  -t, --type <type>             # Type of VS Code release (stable/insider)
  -n, --no_cache                # Disable caching of ChromeDriver download (default: false)
  -h, --help                    # display help for command
```

### Build and Install Extension from vsix

To manually build and install your extension. This step is not necessary to run the tests, since the framework will run the extension directly from source.

```shell
Usage: extest install-vsix [options]

Install extension from vsix file into test instance of VS Code

Options:
  -s, --storage <storage>                      # Use this folder for all test resources
  -e, --extensions_dir <extensions_directory>  # VS Code will use this directory for managing extensions
  -f, --vsix_file <file>                       # path/URL to vsix file containing the extension
  -y, --yarn                                   # Use yarn to build the extension via vsce instead of npm (default: false)
  -t, --type <type>                            # Type of VS Code release (stable/insider)
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
  -c, --code_version <version>                 # Version of VS Code to download
  -t, --type <type>                            # Type of VS Code release (stable/insider)
  -y, --yarn                                   # Use yarn to build the extension via vsce instead of npm (default: false)
  -i, --install_dependencies                   # Automatically install extensions your extension depends on (default: false)
  -n, --no_cache                               # Disable caching of VS Code and ChromeDriver downloads (default: false)
  -h, --help                                   # display help for command
```

### Run Tests

To run test files

```shell
Usage: extest run-tests [options] <testFiles>

Run the tests files specified by a glob pattern

Options:
  -s, --storage <storage>                      # Use this folder for all test resources
  -e, --extensions_dir <extensions_directory>  # VS Code will use this directory for managing extensions
  -c, --code_version <version>                 # Version of VS Code to be used
  -t, --type <type>                            # Type of VS Code release (stable/insider)
  -o, --code_settings <settings.json>          # Path to custom settings for VS Code json file
  -u, --uninstall_extension                    # Uninstall the extension after the test run (default: false)
  -m, --mocha_config <mocharc.js>              # Path to Mocha configuration file
  -l, --log_level <level>                      # Log messages from webdriver with a given level (default: "Info")
  -f, --offline                                # Attempt to run without internet connection, make sure to have all requirements downloaded (default: false)
  -C, --coverage                               # Enable code coverage using c8
  -h, --help                                   # display help for command
```

### Set up and Run Tests

Perform all test setup and run tests in a single command

```shell
Usage: extest setup-and-run [options] <testFiles>

Perform all setup and run tests specified by glob pattern

Options:
  -s, --storage <storage>                      # Use this folder for all test resources
  -e, --extensions_dir <extensions_directory>  # VS Code will use this directory for managing extensions
  -c, --code_version <version>                 # Version of VS Code to download
  -t, --type <type>                            # Type of VS Code release (stable/insider)
  -o, --code_settings <settings.json>          # Path to custom settings for VS Code json file
  -y, --yarn                                   # Use yarn to build the extension via vsce instead of npm (default: false)
  -u, --uninstall_extension                    # Uninstall the extension after the test run (default: false)
  -m, --mocha_config <mocharc.js>              # Path to Mocha configuration file
  -i, --install_dependencies                   # Automatically install extensions your extension depends on (default: false)
  -l, --log_level <level>                      # Log messages from webdriver with a given level (default: "Info")
  -f, --offline                                # Attempt to run without internet connection, make sure to have all requirements downloaded (default: false)
  -C, --coverage                               # Enable code coverage using c8
  -n, --no_cache                               # Disable caching of VS Code and ChromeDriver downloads (default: false)
  -h, --help                                   # display help for command
```

### Caching Behavior

The ExTester implements a caching mechanism for both VS Code and ChromeDriver downloads to improve performance and reduce bandwidth usage. Here's how it works:

#### Default Caching Behavior

1. **Resource Caching**:
   - When downloading, archives are saved with version-specific names (e.g., `1.84.2-stable.zip` for VS Code, `114.0.5735.90-chromedriver_win32.zip` for ChromeDriver)
   - Before downloading, the system checks if a matching version exists in the cache
   - If found in cache, the download is skipped and the cached archive is unpacked
   - The archive is preserved for future use

#### Using --no_cache

When the `--no_cache` option is enabled:

1. **Resource Behavior**:
   - Always downloads a fresh copy of the archive
   - Saves it with a generic filename (e.g., `stable.zip` for VS Code, `chromedriver_win32.zip` for ChromeDriver)
   - After unpacking, the downloaded archive is removed
   - Note: If a version is already unpacked, it will be reused even with --no_cache to avoid unnecessary unpacking

> **NOTE:** `Unpacked` refers to the extracted VS Code and ChromeDriver executables that are ready to run, stored separately from their downloaded archives. This is a critical distinction to understand when working with ExTester's caching system.

## Using the API

The same actions are available in the `ExTester` class as API:

```typescript
export interface SetupOptions {
  /** version of VS Code to test against, defaults to latest */
  vscodeVersion?: string;
  /** when true run `vsce package` with the `--yarn` flag */
  useYarn?: boolean;
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
  /** logging level of the webdriver */
  logLevel?: VSBrowserLogLevel;
  /** try to perform all setup without internet connection, needs all requirements pre-downloaded manually */
  offline?: boolean;
}
/** defaults for the [[RunOptions]] */
export declare const DEFAULT_RUN_OPTIONS: {
  vscodeVersion: "latest";
  settings: "";
  logLevel: logging.Level.INFO;
  offline: false;
};

/**
 * ExTester
 */
export declare class ExTester {
  private code;
  private chrome;
  constructor(storageFolder?: string, releaseType?: ReleaseQuality, extensionsDir?: string);
  /**
   * Download VS Code of given version and release quality stream
   * @param version version to download, default latest
   */
  downloadCode(version?: string): Promise<void>;
  /**
   * Install the extension into the test instance of VS Code
   * @param vsixFile path to extension .vsix file. If not set, default vsce path will be used
   * @param useYarn when true run `vsce package` with the `--yarn` flag
   */
  installVsix({ vsixFile, useYarn }?: { vsixFile?: string; useYarn?: boolean }): Promise<void>;
  /**
   * Install an extension from VS Code marketplace into the test instance
   * @param id id of the extension to install
   */
  installFromMarketplace(id: string): Promise<void>;
  /**
   * Download the matching chromedriver for a given VS Code version
   * @param vscodeVersion selected versio nof VS Code, default latest
   */
  downloadChromeDriver(vscodeVersion?: string): Promise<void>;
  /**
   * Performs all necessary setup: getting VS Code + ChromeDriver
   * and packaging/installing extension into the test instance
   *
   * @param options Additional options for setting up the tests
   */
  setupRequirements(options?: SetupOptions): Promise<void>;
  /**
   * Performs requirements setup and runs extension tests
   *
   * @param testFilesPattern glob pattern for test files to run
   * @param vscodeVersion version of VS Code to test against, defaults to latest
   * @param setupOptions Additional options for setting up the tests
   * @param runOptions Additional options for running the tests
   *
   * @returns Promise resolving to the mocha process exit code - 0 for no failures, 1 otherwise
   */
  setupAndRunTests(
    testFilesPattern: string,
    vscodeVersion?: string,
    setupOptions?: Omit<SetupOptions, "vscodeVersion">,
    runOptions?: Omit<RunOptions, "vscodeVersion">,
  ): Promise<number>;
  /**
   * Runs the selected test files in VS Code using mocha and webdriver
   * @param testFilesPattern glob pattern for selected test files
   * @param runOptions Additional options for running the tests
   *
   * @returns Promise resolving to the mocha process exit code - 0 for no failures, 1 otherwise
   */
  runTests(testFilesPattern: string, runOptions?: RunOptions): Promise<number>;
}
```
