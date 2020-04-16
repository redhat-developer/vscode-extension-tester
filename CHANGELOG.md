# Change Log

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
