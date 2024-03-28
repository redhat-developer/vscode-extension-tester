![windowcontrols](https://user-images.githubusercontent.com/4181232/56654449-622dc000-6690-11e9-9222-f8dc0dbd59dc.png)

Controls to the whole window. Use at your own risk.

#### Lookup
```typescript
import { TitleBar } from 'vscode-extension-tester';
...
const controls = new TitleBar().getWindowControls();
```

#### Manipulate Window
```typescript
// minimize
await controls.minimize();
// maximize
await controls.maximize();
// restore
await controls.restore();
// close... if you dare
await controls.close();
```