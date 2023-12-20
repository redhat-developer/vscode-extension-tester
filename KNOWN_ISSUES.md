# Known Issues

## Tests getting stuck on launch on Linux (CentOS based)

This is likely due to a missing dependency on ChromeDriver that runs underneath. If such a scenario occurs, we recommend installing the Chrome browser rpm, since it depends on all the required libraries.

## VS Code Version Support & Backward Compatibility

ExTester **currently supports the latest 3 minor releases** of VS Code (subject to change if VS Code 2.x ever comes out). Additionally, the oldest release of VS Code that can be successfully used with ExTester is `1.37.0`. Older versions of VS Code might not work at all.

Versions older than the supported 3 latest releases, but still newer than `1.37.0` will most likely work just fine. However, if they stop working over time, there will be no more fixes to make them work. Unless you'd like to contribute these.

## MacOS known limitations of native objects

The macOS has limitations due to its platform specific native components used also by Visual Studio Code. These components are not at this moment supported on side of vscode-extension-tester / page-objects library. The mentioned not supported components are:

- **native modal dialogs** (e.g. file/folder dialogs)
- **native context menus** (e.g. click on Manage button)
- **native menu title bar** (e.g. navigation in menu as File > New File...)

We are trying to bring some solution or workarounds, because currently there is no other option.

1. in case you need to use **dialogs**, please use simple dialogs in VS Code (see [wiki using dialogs](https://github.com/redhat-developer/vscode-extension-tester/wiki#using-dialogs))
2. for **context menus** and **title bar**, please use command equivalents from VS Code command palette

## Migrating to ExTester 4.0.0+

### ExTester API

In the 4.0 update, the `ExTester` API was revamped. If you are not using the API to launch your tests, no action is needed here.
The methods `setupRequirements`, `runTests` and `setupAndRunTests` have had their arguments changed from the long telescope list to structured objects.

The new signatures now involve `SetupOptions` and `RunOptions` objects respectively:

- `setupRequirements(options: SetupOptions)`
- `runTests(options: RunOptions)`
- `setupAndRunTests(testFilesPattern: string, vscodeVersion: string = 'latest', setupOptions: SetupOptions, runOptions: RunOptions)` (though here the options don't include vscode version)

- Both interfaces are exported and contain the list of options you would use as arguments in their respective methods. Any argument that used to have a default value is marked as optional in the interfaces.

### Page Objects

A few page objects have had slight changes to their API. Others have had their inner workings changed that may influence tests with tight timeouts.

- Context Menus now wait for all their items to load before you can manipulate them
  - this will not affect any APIs, but will slow down tests, so be careful if your test timeouts are tight
- Settings Editor waits for the whole page to finish loading when searching for a setting
  - once again, test time is going to increase, care about timeouts
- Action Bar & its items methods are now all asynchronous
  - `ActionBar` methods `getViewControl` and `getGlobalAction` are now async, make sure to await them
  - `ViewControl` and `ActionsItem` method `getTitle` is now async, make sure to await
  - `ViewControl` and `ActionsItem` constructors were changed to take a `WebElement` directly, instead of a title
    - hopefully, no one was using these directly, but if you do, use `ActionBar#getViewControl` or `getGlobalAction` instead to get the proper object
