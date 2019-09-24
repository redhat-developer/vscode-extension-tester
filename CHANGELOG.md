# Change Log

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
