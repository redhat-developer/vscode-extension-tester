![bottomBar](https://user-images.githubusercontent.com/4181232/56640335-099bfa00-6673-11e9-957f-37c47db20ff4.png)

#### Lookup
```typescript
import { BottomBarPanel } from 'vscode-extension-tester';
...
const bottomBar = new BottomBarPanel();
```

#### Open/Close the panel
```typescript
// open
await bottomBar.toggle(true);
// close
await bottomBar.toggle(false);
```

#### Maximize/Restore the panel
```typescript
await bottomBar.maximize();
await bottomBar.restore();
```

#### Open specific view in the bottom panel
```typescript
const problemsView = await bottomBar.openProblemsView();
const outputView = await bottomBar.openOutputView();
const debugConsoleView = await bottomBar.openDebugConsoleView();
const terminalView = await bottomBar.openTerminalView();
```