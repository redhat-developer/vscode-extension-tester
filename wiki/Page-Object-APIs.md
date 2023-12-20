In order to keep everyone from having to go through the VS Code DOM, which is quite complicated, the framework provides page objects to work with parts of VS Code directly.

See the individual page object pages below for quick usage guide. For complete API reference, you can generate typedoc with ```npm run doc``` and check the ```docs``` folder.

##### Activity Bar
 - [[ActionsControl]]
 - [[ActivityBar]]
 - [[ViewContol]]

##### Bottom Bar
 - [[BottomBarPanel]]
 - [[DebugConsoleView]]
 - [[ProblemsView]]
 - [[OutputView]]
 - [[TerminalView]]

##### Dialogs
 - [[ModalDialog]]

##### Editor
 - [[ContentAssist]]
 - [[FindWidget]]
 - [[TextEditor]]
 - [[EditorView]]
 - [[SettingsEditor]]
   - [[Setting]]
 - [[WebView]]
 - [[DiffEditor]]
 - [[CustomEditor]]

##### Menu
 - [[ContextMenu]]
 - [[ContextMenuItem]]

##### Title Bar
 - [[TitleBar]]
 - [[TitleBarItem]]
 - [[WindowControls]]

##### Side Bar
 - [[SideBarView]]
 - [[ViewContent]]
 - [[ViewItem]]
 - [[ViewSection]]
   - [[DefaultTreeSection]]
   - [[CustomTreeSection]]
   - [[ExtensionsViewSection]]
 - [[ViewTitlePart]]
 - [[ScmView]]
 - [[DebugView]]

##### Status Bar
 - [[StatusBar]]

##### Workbench
 - [[Notification]]
 - [[NotificationsCenter]]
 - [[Workbench]]
 - [[Input]]
 - [[DebugToolbar]]

***

##### Native Dialogs
There is also a limited support for handling native dialogs done via virtual key presses. This requires installing the module `vscode-extension-tester-native` alongside the main ExTester package.

If you venture into this territory, make sure the application does not lose focus and you are not touching the keyboard while a native dialog is being handled.
 - [[OpenDialog]]

Extest now also contributes new commands to open files or folders without using native dialogs. If you simply need either open, we recommend using the commands instead of the open dialog for increased stability. Learn more about opening files and folders [here](https://github.com/redhat-developer/vscode-extension-tester/wiki#opening-files-and-folders).
