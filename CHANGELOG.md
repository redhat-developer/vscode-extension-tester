# Change Log

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
