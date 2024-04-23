It is possible to take screenshots when testing Visual Studio Code extensions.
Screenshot can be captured by calling:

```typescript
VSBrowser.instance.takeScreenshot(basename: string)
```

Captured screenshots will be saved in *screenshots* folder which can be found in a test storage folder (`$TMPDIR/test-resources` by default).
File name will be generated from given basename in the following format: `${basename}.png`.

#### Mocha integration

Tester takes screenshots on all failed test cases. Screenshot name is
determined by calling `this.currentTest.fullTitle()`. This feature does not apply to Mocha
hooks by default. In order to capture screenshots on failed hooks, one
must import vscode-extension-tester hook.

```typescript
// Supported hooks: before, beforeEach, after and afterEach
import { before } from 'vscode-extension-tester'
```
