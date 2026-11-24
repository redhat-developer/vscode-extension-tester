# Compiled tests or TypeScript sources

**Compiled JavaScript** (default): the runner maps each test from **Root Folder** to **Output Folder** and runs the `.js` file.

```json
"extesterRunner.rootFolder": "src",
"extesterRunner.outputFolder": "out"
```

```
src/ui-test/editor.test.ts  →  out/ui-test/editor.test.js
```

Compile the tests before each run, or let **Pre-Run Task** do it.

**TypeScript sources**: run the `.ts` files as they are, without compiling.

```json
"extesterRunner.runSources": true
```

`rootFolder` and `outputFolder` are then ignored. Requires ExTester 8.29.0 or later and `tsx` installed where ExTester runs, the workspace folder of the tests.
