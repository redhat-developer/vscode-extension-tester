# Change Log

## NEXT

> Month DD YYYY

## 6.0.0

> November 28 2023

- [🚫 Bug] Running order is wrong when running multiple test in multiple files
- [🚫 Bug] Workbench().executeCommand executes always the first command from quickPicks
- [🚫 Bug] Failed when call debugView.getText(), only on macOS
- [🚫 Bug] Tests hang after loading mocha configurations
- [🚫 Bug] Clicks not being intercepted in SideBarView and BottomBarPanel
- [🚫 Bug] BottomBarPanel().openOutputView() no such element: Unable to locate element
- [🚫 Bug] "WebDriverError: unknown error: Chrome failed to start: exited abnormally" issue
- [🚀 Request] Print path to screenshots folder into console after failed run
- [🚀 Request] Unable to access webview present in Sidebar
- [🚀 Request] Support for VS Code 1.74.x
- [🚀 Request] Provide colors for warning messages in console log
- [🚀 Request] Provide warning for supported version of NodeJS in console log
- [🚀 Request] Access WebView in BottomBar

## 5.10.0

> October 09 2023

- [Request] Support for VS COde 1.82.3 and 1.83.0
- [Request] Expose Wiki files to "docs" folder
- [Bug] Workbench().openSettings().findSetting does not work on 1.83.0
- [Request] Add support for installing dependencies in the extest install-vsix command
- [Request] Support interacting with quickpicks using canSelectMany
- [Bug] Not able to find setting extension-id.title.path
- [Request] Add support for Node 18 LTS
- [Bug] Failing UI tests in 'afterAll' 180s timeout for ubuntu-latest runners

## 5.9.1

> August 22 2023

- [Request] Support for VS Code 1.81.1
- [Bug] getCodeLenses method ignores codelenses in span after first
- [Bug] npm run ui-test starts a shared VSCode instance, not running test files
- [Bug] Exception trying to discover chromedriver version: error sending request for url

## 5.9.0

> August 04 2023

- [Request] Support for VS Code 1.81.0
- [Request] Support for VS Code 1.80.2
- [Bug] GitHub actions Error during screenshots in after/before all/each step
- [Request] How to access the variables view

## 5.8.0

> June 16 2023

- [Request] Support for latest VS Code stable 1.79.2
- [Bug] Lookup timeout when downloading VSCode
- [Request] Upgrade got dependency

## 5.7.1

> June 08 2023

- [Bug] Could not paste from clipboard issue only on Windows

## 5.7.0

> June 07 2023

- [Bug] Test suite is not fully executed on Windows
- [Bug] TextEditor > getSelectedText is not working on macOS
- [Request] Replace unmaintained unzip-stream dependency
- [Request] Inputbox's create function does not have a field to pass a timeout
- [Bug] BottomBar open view method is not working properly in case there is '...' (More) button displayed
- [Bug] RequestError: getaddrinfo ENOTFOUND update.code.visualstudio.com when running the demo
- [Bug] Verify clipboard is preserved during test run
- [Bug] Codelens.click does not work in some cases
- [Bug] TextEditor > typeTextAt() method is not properly working mainly on macOS
- [Bug] helloworld-sample not working as expected and Debug not working

## 5.6.0 (May 17 2023)

- Bump 'max' placeholder to 1.78.2 version
- Fix EditorView.getAction() is not working with VS Code 1.70+ (#771)
- Fix regression Terminal View bug in VS Code 1.67.2 (#770)

## 5.5.3 (April 25 2023)

- Bump 'max' placeholder to 1.77.3 version

## 5.5.2 (April 04 2023)

- Remove versionInfo.browser check in Workbench
- Remove .js file existence restriction
- Use vsce API instead CLI
- Allow to consume multiple strings blob as extester cli arg
- Provide terminal.copyOnSelection as default extester vscode setting

## 5.5.1 (March 16 2023)

- Bump 'max' placeholder to 1.76.2 version

## 5.5.0 (March 15 2023)

- Compatible with VS Code 1.76.0 and 1.76.1 versions
- Bump extester inner dependencies
- Fixed [#537](https://github.com/redhat-developer/vscode-extension-tester/issues/537) Can't get text from terminal view

## 5.4.0 (February 21 2023)

- Compatible with VS Code 1.75.0 and 1.75.1 versions
- Override WebElement.isSelected for EditorView
- Provide log warning when used vscode version differs from 'latest' version enhancement
- Fix invalid artefact screenshot path in Github Actions

## 5.3.0 (January 24 2023)

- Renamed default branch from 'master' to 'main'
- Fixed Werbview.switchToFrame with VS Code 1.74+ when there are several webview opened
- Bump extester inner dependencies
- Stabilized flaky CustomTreeSection > getVisibleItems tests on macOS
- Improved ExTester GH workflows
- Enabled dependabot for the repository

## 5.2.1 (December 20 2022)

- Bump 'max' placeholder to 1.74.1 version
- Compatible with 1.74.0 and 1.74.1
- Fix Hook context for screenshots in before/after/beforeAll/afterAll
- Fix WebView component

## 5.2.0 (December 1 2022)

- Bump 'max' placeholder to 1.73.1 version
- Compatible with 1.72.1, 1.72.2 and 1.73.1
- Improved looking up actions via label-name
- Migrated from deprecated TSLint to ESLint
- Bump extester inner dependencies to latest versions, e.g.
  - selenium-webdriver | 4.2.0 --> 4.6.1
  - typescript | 4.4.2 --> 4.9.3
  - @types/mocha | 8.2.3 --> 10.0.0

## 5.1.0 (October 26 2022)

- Added GitHub Actions badges into package readme file
- Added getAllVisibleMarkers instead unstable getAllAMarkers in ProblemsView component
- Added Disconnect button click to DebugToolBar component
- Applied min/max placeholder feature to API
- Fixed TerminalView.getText() method

## 5.0.0 (September 19 2022)

- Included support for VSCode 1.70.2, 1.71.2
- Add placeholder min/max values to --code_version option
- Add open resource CLI/API option
- Fix yarn compatibility
- Rewrite synchronized getters in Notifications, ViewItem and SettingsEditor to async

## 4.4.1 (August 05 2022)

- Upversion vscode-extension-tester dependency on monaco-page-objects to 2.0.1

## 4.4.0 (August 03 2022)

- support for taking screenshots on error in beforeAll/afterAll methods
- included support for VSCode 1.69
- patch for opening command pallette on Mac OS
- increased timeout for mocha suite afterAll method
- added 1.67.x and 1.68.x as tested configuration on GitHub Actions

## 4.3.0 (June 24)

- upgraded to use selenium-webdriver 4
- supports vscode 1.66.2
- fixed closeAllEditors(groupIndex) method
- dependabot alerts fixes

## 4.2.5 (May 2)

- fixes for dependabot allerts
- Compatible with 1.65
- Update node version in github workflows to LTS 16

## 4.2.4 (Feb 22)

- fixes for dependabot allerts
- Compatible with 1.62.3, 1.63.2 and 1.64.0
- include proxy support when downloading components, #400

## 4.2.3 (Nov 11)

- fix for vscode 1.62.1 cli commands not working

## 4.2.2 (Nov 8)

- compatible with vscode 1.62
- CustomEditor save action should no longer get swallowed by the webview in some cases
- Workbench should now properly open command prompt even if a webview is opened in the editor
- TextEditor and CustomEditor now have a `saveAs` method
- TextEditor `typeText` has been split to:
  - `typeText` - types text at current coordinates
  - `typeTextAt` - types text at given coordinates
- All methods that perform a lookup of editors by title now use the same locator to retrieve the title
- TextEditor can now search for `CodeLens` objects
- ContentAssist now scrolls through its entire list to find items with `getItem` or `hasItem` methods
- Replaced `request` with `got` as the library that downloads files
  - no more deprecation warnings
  - reports download progress every 2 seconds

## 4.2.1 (Oct 12)

- compatibility with vscode 1.61
- `StatusBarItem` lookup by title is now performed by visible label for all versions of vscode
- `DefaultTreeSection` method `findItem` no longer loops indefinitely when `depth` parameter is used and item does not exist within the given depth
- `Notification` page object now has an `expand` method
  - when calling `getSource` a notification is now expanded automatically (usually the source would be hidden unless expanded)
- `CustomEditor` page object added to service the custom editor & custom text editor extension points
- ChromeDriver should now start properly even if the vscode binary's path is too long for its liking on mac
- `VSBrowser#openResources` should now work properly with insider stream on mac

## 4.2.0 (Sep 3)

- compatibility with vscode 1.60
- changes to opening folders and files
  - `api-handler` extension is retired
  - `native` module is now deprecated and will be removed as well
  - `VSBrowser` now has a new method `openResources` which can open files or folders from multiple paths at the same time
  - `Files > Simple Dialog` setting is now enabled by default (no more native open dialogs)
- `Window > Dialog Style` setting is set to `custom` by default (modal dialogs are no longer native)
- first attempt to handle the native title bar on MacOS
  - new class `MacTitleBar`, allows to select an item from the top menu, e.g. `select('File', 'New File')`
  - it might not be particularly stable yet
- `TreeSection` when `openItem` can't find an item, the available items in the error message will be sorted alphabetically

## 4.1.2 (Aug 6)

- compatibility with vscode 1.59
- `LinkSetting` error messages updated to indicate `getValue` and `setValue` are not available
- `TerminalView`'s `executeCommand` now waits for the command to finish before resolving, with optional timeout
- `BottomBar` open methods should now work when repeatedly switching tabs back and forth
- updated most dependencies

## 4.1.1 (Jul 14)

- `ViewSection` now has `moreActions` method to open the `More Actions` context menu if available
- `ViewPanelAction`'s `getLabel` method is now async, returns `Promise<string>` instead of a static string
- `TreeSection`'s `openItem` now lists available items on given segment of the path if the item could not be found
- `CustomTreeItem` now has `getDescription` method
- `TreeSection`'s `findItem` now waits for the item container to load if called directly after opening the view
- changes to `WebView`:
  - now checks for both pre and post vscode 1.56 versions of web view when switching to frame (some people seem to be able to still summon both versions)
  - finds the proper web view to switch to when multiple iframes are present on screen
  - allows a few seconds for the web view to load before switching to the iframe
- `StatusBar`'s `getItem` now works with vscode 1.58, altough sligtly altered
  - 1.58 no longer exposes the title of the item (the one that appears when hovering over it), instead label is used (the one that is visible on status bar)

## 4.1.0 (Jun 16)

- we are now compatible with vscode 1.56 and 1.57
  - workspace security is disabled by default to keep backwards compatibility, you can enable it with a custom setting if you desire
- new flag `-f` or `--offline` has been added for folks who need to run tests on a disconnected machine:
  - will not attempt to download anything, or access anything on the internet when running
  - needs all the requirements neatly prepared beforehand
- when checking vscode manifest, master branch was replaced with main
  - also if the connection fails, tries to check manifest from an existing vscode
- Debugging support:
  - added new page objects `DebugView` for the sidebar view `Run/Debug` and `DebugToolbar` for the floating debug controls
  - added functionality to toggle breakpoints in text editor
  - `DebugConsoleView` can now evaluate expressions and use `ContentAssist`
- Text Editor additions:
  - methods to find & select text
  - get text selection as a page object (i.e. to open context menu on)
  - get selected text as string
  - get the line number of a given text
  - open the Find Widget
    - new page object `FindWidget`
    - lets you search and replace to your heart's content

## 4.0.3 (Apr 29)

- tree items now have an `expand` method
- simple file dialog should now be less likely to mess up the absolute path input
- `StatusBar` now has methods to find generic status items
  - `getItems` to find all status items
  - `getItem(title)` to find an item by title (the title that pops up when you hover over the item)
- analogically, `EditorView` and `EditorGroup` now have methods to find their respective action buttons on the tab row
  - `getActions` to find all action buttons
  - `getAction(title)` to find a button by title
- `DebugConsoleView` now supports `getText` to return all its current text
- `WebView` now supports the new `iframe` based implementation for future vscode releases

## 4.0.2 (Mar 24)

- move to a new download URL for VS Code, old one got shut down

## 4.0.1 (Mar 3)

- fix `logLevel` always defaulting to `info` when running tests from the API
- increased the timeout for the browser to start
- the `stdout` log now prints messages when the browser is starting and how long it took to start
- all context menus now should wait for their items to load before returning control
- items in the `ActivityBar` needed a fixup and some APIs had to be broken:
  - `string` based contructors are gone for `ActionsControl` and `ViewControl`
  - `ActivityBar` methods `getViewControl` and `getGlobalAction` are now async so error handling works properly on them
  - `ActionsControl` and `ViewControl` method `getTitle` is now async and reflects the dynamic changes to the title
  - fixed `ActivityBar` searching for `ActionsControl` items in the `ViewControl` container

## 4.0.0 (Feb 25)

### Breaking changes

- `ExTester` API has been revamped:
  - the 'telescope' argument pattern has been replaced with interfaces using optional parameters
  - methods with lots of arguments `(arg1, arg2, arg3...)` replaced with `({argX: value,...})` so you don't need to type out every argument in the correct order
  - check out the readme and the wiki for more info on migrating to 4.x

### Fixes and improvements

- notifications with types other than `info` should now be correctly recognized
- dissmiss notification will now wait for the button to appear before trying to click it
- `--mocha_config` CLI flag now correctly displays it wants a value
- removed dependency on a github repo, should help with running behind a proxy
- context menu for `TextEditor` now works with latest versions of vscode
- `vsce` binary is now found on the correct path when the project supplies its own `.bin` folder

### New Features

- view sections now support `welcome content` (the content that shows when the section is empty)
  - `findWelcomeContent` method added to `ViewSection` that returns a `WelcomeContentSection` object (if it exists)
- tree items now have a `getTooltip` method, returns the contents of the tooltip that appears on hover
- `TextEditor` now has `getCoordinates` method (technically it is now made public), returns coordinates as `[x, y]` number array
- `TreeItem#hasChildren` now actually checks if the item has children (not just if it is expandable, because there are expandable items without children)
- `TreeItem` now has `isExpandable` method, that just checks if the item can be expanded (basically what `hasChildren` used to do)

## 3.2.6 (Feb 10)

- now compatible with vscode 1.53
- navigating through the top menu now waits for the whole context menu to load before clicking, slower but more robust
- searching for a setting in the settings editor now also waits for the page to finish loading
- simple file dialog should now be less likely to randomly 'correct' the file path on confirm
- fixed wrong file name with the vscode-insiders archive
- screenshot capture file names have been sanitized, should no longer error when your test cases contain certain characters

## 3.2.5 (Jan 20)

- error message is now included in the log when screenshot capture fails
- tentative fix for `unknown error: DevToolsActivePort file doesn't exist` on launch
- new page object `ModalDialog`, handles custom style modal dialogs (accessible from vscode 1.50.0 onward via a setting)

## 3.2.4

- fix URL for vscode version check

## 3.2.3 + Page Objects 1.3.0 (Nov 30)

- `runTests` and `setupAndRun` methods from `ExTester` API now properly wait for mocha to finish running before resolving
- `runTests` and `setupAndRun` now return mocha's exit code instead of void
- `ExtensionViewItem#install` now by default waits for the installation to finish before resolving
  - timeout can be passed as argument
  - passing in a zero timeout will skip the wait
- `Menu#select` will now wait for the appropriate menu item to be enabled before clicking it
  - this should fix some menus getting stuck after an item is clicked, with no effect
- `InputBox` should now properly type in paths into Simple file dialog on unix systems
  - if confirming the dialog doesn't in fact confirm it, make sure to use paths that end with a trailing path separator
- `DialogHandler#getOpenDialog` now has a variable delay to wait before trying to get the native dialog
  - note this is still a hard wait, this change is meant to give some people the ability to use longer waits on slower machines

## 3.2.2 + Page Objects 1.2.5 (Oct 29)

- webdriver logs are now collected and saved by default to your test resource folder as `test.log`
  - default log level is INFO
  - use the `-l` or `--log_level <level>` option to change the logging level
- notifications are now constructed directly from a `WebElement` instance, so they are no longer bound by notification's index
  - this changes the notifications' constructors, but hopefully nobody has been using those anyway
- increased the required versions for submodules to their latest, so it should enforce their update as well when updating the main module

## 3.2.1 + Page Objects 1.2.3 (Oct 6)

- not using yarn flag `-y` for setup now automatically adds `--no-yarn` flag to `vsce package` step
  - meaning even if vsce detects yarn on your system, use `-y` to use yarn, npm is used as default
- fixed terminal view locators for vscode 1.49
- the abstract `Editor` class is now also available in the API
- `getFileUri` method added to `TextEditor` in case you need a URI, not just a path
- `toggleAllQuickPicks` method added to `Input` boxes
  - use to select/deselect all quick picks when multi-selection is enabled
- `ViewSection#openItem` now only returns `ViewItem[]`, `void` is no longer

## 3.2.0 + Page Objects 1.2.2 (Aug 24)

- added a new CLI command and an API method to install extensions from marketplace by id
  - `install-from-marketplace id1 id2 ...` from CLI
  - `installFromMarketplace('id')` from `ExTester` API
- updated page objects to work with vscode 1.48.x (mainly SCM view)
  - note that sections in Extensions view have changed their titles

## Page Objects 1.2.1 (Jul 28)

- fixed a few issues related to tree items in the side bar view
  - fixed `getChildItems` always searching for children of the first item with a given name, rather than the one it's been called from
  - `getLabel` now properly return the actual label of the tree item and as such **is now async**
  - TreeSection `openItem` should no longer fail when recursively expanding tree items
  - tree items constructors now take a `WebElement` as their first argument, instead of a `string` (but noone calls those directly anyway)

## 3.1.0 + Page Objects 1.2.0 (Jul 14)

- The backwards compatibility support is being changed:
  - only the latest 5 minor versions of vscode are now being supported and tested
  - older version will still most likely work, but no further effort will be invested into them

### Changes

- vscode 1.47.x support
  - a new implementation of SCM View is now available
- basic support for input boxes with title bars
  - title lookup
  - back button
- new flag `-i` or `--install-depenencies` is now available
  - when used, extension tester will scan the extension dependencies and install them from marketplace

### Fixes

- fixed weird chromedriver permissions for UNIX systems
- project can now be compiled using latest typescript version

## 3.0.2 + Page Objects 1.1.1 (Jun 11)

- fix `SyntaxError: manifest.json` by switching to new vscode branch naming
- vscode 1.46.0 compatibility
  - context menu opening updated to be more robust
- `EditorView#openEditor` loose promise now properly awaited
- methods returning `Promise<T | void>` now return `Promise<T | undefined>` for more convenience

## Page Objects 1.1.0 (Jun 2)

- Added `EditorTab` object to handle open editor tabs (including opening context menus)
- **Removed title from Editor constructor**
  - **Title retrieval now works properly when the title changes**
  - **Editor#getTitle is now async, returns Promise<string>**
- Added `ScmView` object to handle the Source Control view
- Added `findQuickPick` method to `Input` objects
  - use to scroll through a quick pick list to a given label/index
  - returns `Promise<QuickPickItem>`
- `Input#selectQuickPick` now scrolls through the list if the given label/index item is not visible
- Check out the PageObjects wiki page for more info

## 3.0.1 (May 20)

- This was supposed to be part of 3.0.0, but I didn't notice the problem (sorry about that)
- **Breaking:**
  - **Native module is no longer re-exported by the main module**
  - **To use native handlers, import the corresponding types directly from vscode-extension-tester-native**
  - **You now officially don't need the native module to compile**

## 3.0.0 (May 6)

### Changes

- extension tester has been split into modules:
  - main module `vscode-extension-tester`
  - page objects `monaco-page-objects`
    - included as a dependency of the main module
    - updates will be independent to the main module
    - can now possibly be used in a different monaco based editor (like Theia)
  - locators `vscode-extension-tester-locators`
    - included as a dependency of the main module
    - updates will be independent to the main module (new versions of vscode won't require upversions of the main module)
  - native handler `vscode-extension-tester-native`
    - native dialog handler is split from the main module and not included as a dependency
    - if you use native dialogs, you need to install this package to your project

### TL;DR Migration

- upversion `vscode-extension-tester` to 3.0.0, make sure `package-lock.json` is generated properly
- if you are using native dialogs, also npm install `vscode-extension-tester-native`
- API is still the same
- minor/micro updates to dependent modules can now happen without updating the main module

## 2.6.2 (April 28)

- fix errors on launch due to botched 2.6.1 release

## 2.6.1 (April 27)

### Fixes

- `vsce` no longer needs to be installed globally when running commands from vscode terminal
- path to insider build on mac has been fixed
- stable and insider builds of vscode can now be cached at the same time
- switching between stable and insider stream testing no longer requires users to manually delete the cache folder
- `ReleaseQuality` enum is now propely exported for usage within the API

## 2.6.0 (April 16)

### New Features

- VS Code 1.44.x support
  - `QuickOpenBox` is no longer used beginning with this version, the class is still present for backwards compatibility
  - vscode from now on indexes quick picks starting with 0 instead of 1
- Universal support for VS Code insider versions
  - cli now properly supports the `-t` flag for all commands, use `-t insider` to use insiders build (note that insider builds use the `x.y.z-insider` versioning scheme when choosing a version to test)
  - `Extester` API has been changed: instead of each method taking the release stream (stable/insider) as parameter, the constructor is now parametrized. This means you need a different instance for stable and insider builds when using the API

### Fixes

- some 'floating' async operations are now properly awaited
- the cli commands now properly set a non-zero exit code when an error occurs

## 2.5.1 (March 26)

- fixed Input#getQuickPicks getting stuck on items that are not visible
- install-vsix command now supports both local paths and remote URLs for .vsix files

## 2.5.0 (March 20)

### New Features

- new flag `-e` added to specify VSCode extension folder
- support for diff editor
- support for editor groups in EditorView
- VS Code 1.43.x support

## 2.4.0 (February 6)

### New Features

- Webview support - added new page object `WebView` (a subtype of `Editor`)
  - use the `switchToFrame` and `switchBack` methods to switch contexts between the web view container and the default window
  - use the `findWebElement` and `findWebElements` once switched into the web view container

### Fixes

- `Input`'s `clear` and `setText` methods should now properly work when the cursor is not at the end of the displayed text
- `EditorView`'s `openEditor` method now returns the correct subtype of `Editor`
- The runner should no longer try to load a default Mocha configuration file if it doesn't exist

## 2.3.0 (January 22)

- we are no longer using java to handle the native dialogs
  - recommend updating nodejs to at least version 11 when using this framework
  - for those trying to build this project, we now also require a c/c++ compiler to do so

### New Features

- VS Code 1.41.x support
- macOS native open dialog implemented (finally)
- Mocha runner can now be configured using configuration files - more details in the wiki
- QuickPickItem#getText has been replaced with 2 new methods - getLabel and getDescription
  - getLabel now returns the label getText used to
  - getDescription returns the description on the right of the label if it exists
  - getText is now the default webdriver method that returns all text found in the element

### Fixes

- Error: stdout maxBuffer length exceeded in mac now fixed
- Input#getText and Input#clearText should now work on mac
- runTests command should now also have the API-handler available
- Notification#dismiss should no longer throw an error on some VS Code versions
- Input#selectQuickPick fixed on windows
- the project's own test suite is now runnable on macOS (though tests using context menus are skipped)

## 2.2.0 (December 9)

### New Features

- `-u` flag added to commands that run the tests
  - use this flag to uninstall the extension after the test run
  - adequate changes made to the API (argument added to the corresponding methods)
- small api-handler extension has been added for easier workspace manipulation
  - adds 3 new commands to VS Code: `Extest: Open File`, `Extest: Open Folder`, `Extest: Add Folder to Workspace`
  - use these commands to open files or folders without the need for native dialogs
- static `create` method added to `InputBox` and `QuickOpenBox`
  - method waits for the underlying DOM element to be generated, then creates a new page object instance
  - use this method to safely instantiate either class

### Fixes

- `run-tests` command should now properly pass the custom settings file
- problem marker lookup should no longer fail when the marker text contains special characters
- methods that handled text via clipboard should now clean after themselves
  - fixes a situation where values from one method could slip into another through the clipboard
- `Input#getText` should no longer return empty string
- `Getting Started` page should no longer open in a browser for older versions of vscode

## 2.1.1 (November 25)

### Fixes

- Installing the extension from vsix now works when the location contains spaces.

## 2.1.0 (November 12)

### Fixes

- Extension item lookup no longer returns only the first item in the list
- `TextEditor#toggleContentAssist` should no longer get stuck when closing the assistant
- ContentAssist item retrieval should no longer get stuck when no suggestions are available
- Fix `unknown error: DevToolsActivePort file doesn't exist` on chrome start

### Improvements

- --extensionDevelopmentPath flag removed from launch, since a vsix file is being used instead
- Menu items lookup changed to be more robust
- ContentAssist items lookup updated in accordance to menu items
- `TextEditor#toggleContentAssist` will now wait for the content assist to finish loading
- Removed the wait period from the end of the test suite

### Minor API Changes

- `MenuItem#getLabel` is now async (returns `Promise<string>`)
- `ExtensionsViewItem#getTitle` is now async (returns `Promise<string>`)
- `Menu#getItem` now returns `Promise<undefined>` when the item was not found

### Added

- Support for VS Code 1.40.x locators
- `-y / --yarn` flag added to setup commands and API to allow packaging extensions with yarn instead of npm

## 2.0.3 (October 18)

- Locators from multiple versions will now do a proper deep merging
- Updated button locators for VS Code version 1.39.x

## 2.0.2 (October 1)

- Fixed missing dependency

## 2.0.1 (October 1)

- Fixed open dialogs not working properly with different keyboard layouts
- Fixed ExtensionsViewSection not handling extensions with spaces properly

## 2.0.0 (September 24)

### Major (Breaking) changes

- the extension under test is now packed and installed into VS Code, instead of launching from source
- the mechanism for locating elements has been replaced with a new one that supports dynamic locator loading
  - locators are now based off VS Code 1.37.0
  - other versions may now be added by providing a diff file
- ViewSection renamed to TreeSection, added support for other view types

### Added

- Side bar support now includes Explorer View, Extensions View and custom tree views
- Remaining components have now been covered with tests
- Failed tests now automatically take a screenshot of the current browser state
  - the screenshots are saved into the storage directory (default test-resources/screenshots)

## 1.3.0 (August 21 2019)

This release was focused mostly on bugfixes and test coverage.

### Added

- travis build was added with an initial test suite
- example project is now included
- many components have been covered with tests
- moveCursor moved into a separate methoc for text editor
- clearText method added to text editor
- clearFilter method added to problems view

### Changes

- EditorView#openEditorTab renamed to openEditor

### Fixes

- the framework should now launch properly on windows and mac as well as linux
- several windows specific errors have been corrected
- many components have had their locators updated to match latest VS Code

## 1.2.0 (July 15 2019)

### Added

- terminal view actions
- title retrieval methods for objects
- getChildren method for tree views
- close method for context menus
- add error checks for input box
- add password check for input box
- experimental OpenDialog for basic handling of native open file/folder dialogs
- ViewItem buttons support
- SettingsEditor added for handling the VS Code settings
- add the ability to pass in custom settings file for VS Code as json

### Removed

- typedoc removed from the repo due to diff pollution, still available to generate locally

### Fixes

- timeouts for runner launching/exiting VS Code increased to 15 seconds (was 2 seconds)
- prepack script added, no more botched releases
- retrieval of element collections has been synchronized, fixes stale element references
- updated locators for new version of VS Code
- combo handling for bottom bar views now works again

## 1.1.1 (April 25 2019)

The first release to include page object APIs:

- Title Bar
- Context Menus
- Action Bar
- Side Bar Views (explorer)
- Bottom Bar Views
- Text Editor
- Status Bar
- Input Box and Command Palette
- Notifications
