![output](https://user-images.githubusercontent.com/4181232/56642182-2c301200-6677-11e9-9ef3-70fdb914254c.png)

#### Lookup

```typescript
import { BottomBarPanel, OutputView } from 'vscode-extension-tester';
...
const outputView = await new BottomBarPanel().openOutputView();
```

#### Text Actions

```typescript
// get all text
const text = await outputView.getText();
// clear text
await outputView.clearText();
```

#### Channel Selection

```typescript
// get names of all available channels
const names = await outputView.getChannelNames();
// select a channel from the drop box by name
await outputView.selectChannel('Git');
```
