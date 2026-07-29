# Custom Page Objects

When testing a VS Code extension, your extension contributes its own UI — custom tree views, webviews, toolbars, status bar items, and more. ExTester's built-in page objects cover the VS Code shell, but not your extension-specific UI.

Custom page objects let you encapsulate that extension UI into reusable, typed classes — exactly the same way built-in page objects work — so your test code stays clean and readable.

---

## When to use custom page objects

Use a custom page object whenever a test needs to interact with UI that your extension contributes and that is not covered by a built-in page object. Examples:

- A custom webview panel rendered by your extension
- A tree view contributed via `vscode.window.createTreeView`
- A custom status bar item with a specific click target
- Any element with an extension-specific CSS class or `data-` attribute

---

## How it works

At startup, ExTester loads the version-specific built-in locators, then deep-merges your custom locator contribution on top. After that, any page object class that references `MyClass.locators.MyComponent.xxx` will resolve just like a built-in.

You provide:

1. **A locator contribution file** — a compiled JS module that exports a `locators` object in the same shape as a `LocatorDiff`.
2. **One or more page object classes** — TypeScript classes extending `AbstractElement` that use those locators.

---

## Step 1 — Write the locator contribution file

Create a TypeScript file (e.g. `src/test/pageObjects/locators.ts`) that exports a `locators` object. The shape matches `LocatorDiff.locators` — one key per component, each key containing the selectors that component uses.

```typescript
// src/test/pageObjects/locators.ts
import { By } from "vscode-extension-tester";
import type { LocatorDiff } from "vscode-extension-tester";

export const locators: LocatorDiff["locators"] = {
  MyExtensionToolbar: {
    constructor: By.className("my-extension-toolbar"),
    button: By.css(".my-extension-toolbar .action-btn"),
    label: By.css(".my-extension-toolbar .label"),
  },
};
```

Custom keys (like `MyExtensionToolbar`) are accepted without any extra TypeScript configuration. The `LocatorDiff['locators']` type is intentionally open to unknown component names.

This file is compiled to JS as part of your normal test build (e.g. `out/test/pageObjects/locators.js`). The framework loads the **compiled JS**, not the TypeScript source.

---

## Step 2 — Write the page object class

Create a class extending `AbstractElement` in its own file (e.g. `src/test/pageObjects/MyExtensionToolbar.ts`). Reference all selectors via `MyExtensionToolbar.locators` — never hardcode XPath or CSS strings in the class body.

```typescript
// src/test/pageObjects/MyExtensionToolbar.ts
import { AbstractElement } from "vscode-extension-tester";

export class MyExtensionToolbar extends AbstractElement {
  constructor() {
    super(MyExtensionToolbar.locators.MyExtensionToolbar.constructor);
  }

  async clickButton(): Promise<void> {
    const btn = await this.findElement(MyExtensionToolbar.locators.MyExtensionToolbar.button);
    await btn.click();
  }

  async getLabel(): Promise<string> {
    const lbl = await this.findElement(MyExtensionToolbar.locators.MyExtensionToolbar.label);
    return lbl.getText();
  }
}
```

---

## Step 3 — Register the locator contribution

You must tell ExTester where to find the compiled locator contribution file. Do this via `RunOptions` (programmatic) or the CLI flag.

### Programmatic API

Pass `customPageObjects.locatorsPath` in `RunOptions`:

```typescript
import { ExTester } from "vscode-extension-tester";

const exTester = new ExTester();
await exTester.runTests("out/test/**/*.test.js", {
  resources: [],
  customPageObjects: {
    locatorsPath: "./out/test/pageObjects/locators.js",
  },
});
```

The path is resolved relative to the current working directory (same as how `--config` paths work).

### CLI

Use the `-p` / `--custom-page-objects` flag on `run-tests` or `setup-and-run`:

```shell
extest run-tests 'out/test/**/*.test.js' \
  --custom_page_objects ./out/test/pageObjects/locators.js
```

```shell
extest setup-and-run 'out/test/**/*.test.js' \
  --custom_page_objects ./out/test/pageObjects/locators.js
```

---

## Step 4 — Use the class in a test

Import and instantiate the class directly. No registry lookup needed.

```typescript
// src/test/myExtension.test.ts
import { MyExtensionToolbar } from "../pageObjects/MyExtensionToolbar";

describe("MyExtension toolbar", () => {
  it("shows the action button", async () => {
    const toolbar = new MyExtensionToolbar();
    const label = await toolbar.getLabel();
    expect(label).to.equal("My Action");
  });
});
```

---

## Full example layout

```
src/
  test/
    pageObjects/
      locators.ts          ← Step 1: locator contribution file (compiled → out/)
      MyExtensionToolbar.ts ← Step 2: page object class
    myExtension.test.ts    ← Step 4: test file
```

---

## Notes

- The locator contribution is a **deep merge** — you can safely add new component keys alongside the built-in locators without affecting them.
- Only one locator contribution file is supported per test run. Put all custom component locators in that single file.
- The locator contribution file must export a property named `locators` at the module root.
- Page object classes do not need to be registered anywhere — import and use them directly.
