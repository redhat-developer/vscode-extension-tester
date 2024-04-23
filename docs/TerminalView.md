![term](https://user-images.githubusercontent.com/4181232/56642706-53d3aa00-6678-11e9-92b5-35c535ab39af.png)

#### Lookup

```typescript
import { BottomBarPanel, TerminalView } from 'vscode-extension-tester';
...
const terminalView = await new BottomBarPanel().openTerminalView();
```

#### Terminal Selection

```typescript
// get names of all available terminals
const names = await terminalView.getChannelNames();
// select a terminal from the drop box by name
await terminalView.selectChannel('Git');
```

#### Execute Commands

```typescript
await terminalView.executeCommand('git status');
```

#### Get Text

Select all text and copy it to a variable. No formatting provided.

- To allow copy text in terminal on macOS, you need to add specific setup in .vscode/settings.json `"terminal.integrated.copyOnSelection": true`

```typescript
const text = await terminalView.getText();
```
