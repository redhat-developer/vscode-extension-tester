In order to keep everyone from having to go through the VS Code DOM, which is quite complicated, the framework provides page objects to work with parts of VS Code directly.

See the individual page object pages below for quick usage guide.

## AbstractElement — base class for custom page objects

All built-in page objects extend `AbstractElement`, and you can too. When your extension contributes custom UI that is not covered by a built-in, create your own class:

```typescript
import { AbstractElement, By } from "vscode-extension-tester";

export class MyExtensionPanel extends AbstractElement {
  constructor() {
    super(MyExtensionPanel.locators.MyExtensionPanel.constructor);
  }
  // ... your interaction methods
}
```

The locator keys (`MyExtensionPanel.locators.MyExtensionPanel.*`) are resolved from a locator contribution file you provide at startup. See [[Custom-Page-Objects]] for the full setup guide.

##### Activity Bar

- [[ActionsControl]]
- [[ActivityBar]]
- [[ViewControl]]

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
