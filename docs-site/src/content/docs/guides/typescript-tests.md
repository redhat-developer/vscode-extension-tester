---
title: TypeScript Tests
---

ExTester can load `.ts`, `.tsx`, and `.cts` tests and custom locator modules in CommonJS projects without compiling the tests to JavaScript first. Install the optional `tsx` peer dependency in the package containing your tests, using your package manager:

```shell
npm install --save-dev tsx
# or
yarn add --dev tsx
# or
pnpm add --save-dev tsx
```

Run ExTester from that package's directory. After the usual VS Code, ChromeDriver, and extension setup, target the source files:

```shell
npx extest run-tests 'src/**/*.test.ts'
```

Alternatively, set source paths in `extester.config.json`:

```json
{
  "run": {
    "testFiles": ["src/**/*.test.ts"],
    "customPageObjects": "./src/pageObjects/locators.ts"
  }
}
```

Omit `customPageObjects` if you do not use custom locators. The same source patterns work with `setup-and-run` and the `ExTester.runTests()` / `ExTester.setupAndRunTests()` APIs.

ExTester detects TypeScript files after expanding the test patterns, resolves `tsx` from the current working directory, and registers it before loading tests or custom locators. Imported TypeScript helpers are transformed too. Mixed JavaScript/TypeScript suites are supported. No Mocha `require` option or Node preload flag is necessary. JavaScript-only suites with JavaScript locators do not require `tsx`.

If a TypeScript loader is already registered when the tests start — for example through `NODE_OPTIONS="--require ts-node/register"` or `NODE_OPTIONS="--import tsx"` — ExTester keeps it and does not register `tsx` again. Existing setups therefore continue to work unchanged.

This integration uses CommonJS module loading. Use a CommonJS package (omit `"type": "module"` or set `"type": "commonjs"`), or `.cts` sources. Native ESM suites (`.mts` or `.ts` in a `"type": "module"` package) are not supported by this integration. TypeScript config files are not automatically loaded through `tsx`. If a JavaScript entry point imports TypeScript helpers, include a TypeScript test entry point or configure the loader yourself.

## Missing optional dependency

If TypeScript inputs are found but `tsx` cannot be resolved, ExTester fails with a nonzero exit status and an error identifying the file and resolution directory:

```text
ExTester cannot load TypeScript file "src/example.test.ts": the optional dependency "tsx" could not be resolved from "<project>".

Install it in the package containing your tests:
  npm install --save-dev tsx
  yarn add --dev tsx
  pnpm add --save-dev tsx

Then rerun ExTester. No Mocha loader configuration is required.
```

In a monorepo, declare `tsx` in the workspace package that runs ExTester and run the command from that directory. A global installation or a dependency installed only in an unrelated workspace is not sufficient.

## Type checking and extension builds

`tsx` transpiles on demand; it does not type-check your tests. Retain a separate check, for example:

```shell
npx tsc --noEmit --project tsconfig.json
```

You can remove the step that emits compiled **test** files. The extension and its webview still need to be built as usual, unless you test a prebuilt VSIX.
