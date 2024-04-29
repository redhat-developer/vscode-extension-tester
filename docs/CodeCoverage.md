To generate a code coverage report using the [c8](https://github.com/bcoe/c8) tool, include the `-C` (or `--coverage`) 
option when running tests via a CLI command 
[`extest run-tests`](Test-Setup#set-up-and-run-tests) or 
[`extest setup-and-run`](Test-Setup#run-tests).

### Configuration Options

A configuration file can change the default behaviors of the c8 tool.  The framework searches for c8 JSON configuration files named `.c8rc`, `.c8rc.json`, `.nycrc`, or `.nycrc.json`, starting from the root of your project and walking up the filesystem tree. You can check out what options are supported in the [c8 documentation](https://github.com/bcoe/c8?tab=readme-ov-file#cli-options--configuration).

If no c8 JSON configuration file is provided, the following default
values will be used:

```typescript
    const reportOptions: any = {
      "reporter": ["text", "html"],
      "all": false,
      "excludeNodeModules": true,
      "include": [],
      "exclude": [
          "coverage/**",
          "packages/*/test{,s}/**",
          "**/*.d.ts",
          "test{,s}/**",
          "test{,-*}.{js,cjs,mjs,ts,tsx,jsx}",
          "**/*{.,-}test.{js,cjs,mjs,ts,tsx,jsx}",
          "**/__tests__/**",
          "**/{ava,babel,nyc}.config.{js,cjs,mjs}",
          "**/jest.config.{js,cjs,mjs,ts}",
          "**/{karma,rollup,webpack}.config.js",
          "**/.{eslint,mocha}rc.{js,cjs}"
      ],
      "extension": [
          ".js",
          ".cjs",
          ".mjs",
          ".ts",
          ".tsx",
          ".jsx"
      ],
      "excludeAfterRemap": false,
      "skipFull": false,
      "tempDirectory": this.targetDir,
      "resolve": "",
      "omitRelative": true,
      "allowExternal": false,    
    };
```
where `this.targetDir` is a directory created under the temporary directory specified with
the `TMP` enviornment variable and coverage reports are saved under `./coverage`, where the `c8` tool stores outputs by default.

### Notes on loading source files when code coverage is enabled

With code coverage enabled, there's no need to build a vsix 
file as sources will be loaded directly from your 
project directory during testing. By default the framework does not build or install a vsix file when code coverage enabled by the CLI `-C` (or `--coverage`) option. 

However, in special situations where you need to load a vsix file in your test, for example, when you need to test the Extensions SideBar for installed extensions, add the `-u` (or `--uninstall_extension`) option. 

When `-u` option is specified, the framework will build and install a vsix file prior to executing tests. After completing the test run, the framework uninstall the vsix file. 
Keep in mind that even when using the `-u` option, source codes will still be sourced directly from your
project directory with code coverage enabled.