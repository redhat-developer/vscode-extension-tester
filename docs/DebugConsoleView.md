Page object needs extending, currently minimal support.

#### Lookup

```typescript
import { BottomBarPanel, DebugConsoleView } from 'vscode-extension-tester';
...
const debugView = await new BottomBarPanel().openDebugConsoleView();
```

#### Text Handling

```typescript
// get all text as string
const text = await debugView.getText();
// clear the text
await debugView.clearText();
```

#### Expressions

```typescript
// type an expression
await debugView.setExpression('expression');
// evaluate an existing expression
await debugView.evaluateExpression();
// type and evaluate an expression
await debugView.evaluateExpression('expression');
// get a handle for content assist
const assist = await debugView.getContentAssist();
```
