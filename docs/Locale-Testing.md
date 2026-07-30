# Locale Testing

ExTester supports launching the test VS Code instance in a non-English display language. This lets you verify that your extension's UI strings, commands, and interactions behave correctly when VS Code itself is localized — for example, when running in Russian, Chinese, or French.

---

## How it works

VS Code's display language is controlled by two files that must exist in its user-data directory before launch:

- `User/locale.json` — declares which locale to use (e.g. `{ "locale": "ru" }`)
- `languagepacks.json` — registry mapping locale codes to installed language pack extensions

ExTester writes both files automatically when you pass the `--locale` / `-L` flag. All you need to do is declare the language pack as an extension dependency so it gets installed into the test instance.

---

## Step 1 — Declare the language pack as a dependency

Add the language pack extension ID to `extensionDependencies` in your extension's `package.json`:

```json
{
  "extensionDependencies": ["ms-ceintl.vscode-language-pack-es"]
}
```

Language pack extension IDs follow the pattern `ms-ceintl.vscode-language-pack-<locale>`. Some common ones:

| Locale              | Extension ID                             |
| ------------------- | ---------------------------------------- |
| Russian             | `ms-ceintl.vscode-language-pack-ru`      |
| Simplified Chinese  | `ms-ceintl.vscode-language-pack-zh-hans` |
| Traditional Chinese | `ms-ceintl.vscode-language-pack-zh-hant` |
| French              | `ms-ceintl.vscode-language-pack-fr`      |
| German              | `ms-ceintl.vscode-language-pack-de`      |
| Japanese            | `ms-ceintl.vscode-language-pack-ja`      |
| Korean              | `ms-ceintl.vscode-language-pack-ko`      |
| Spanish             | `ms-ceintl.vscode-language-pack-es`      |
| Portuguese (Brazil) | `ms-ceintl.vscode-language-pack-pt-br`   |
| Italian             | `ms-ceintl.vscode-language-pack-it`      |

Find the full list on the [VS Code Marketplace](https://marketplace.visualstudio.com/search?term=language%20pack&target=VSCode).

> **Important:** `extensionDependencies` must only contain extensions that are available on the VS Code Marketplace. For offline or private setups see the [Programmatic API](#programmatic-api) section below.

---

## Step 2 — Run with `-i` and `-L`

Pass both flags together to `setup-and-run` (or `run-tests`):

```shell
extest setup-and-run './out/test/**/*.test.js' \
  -i \
  -L ru \
  -e ./test-extensions \
  -r .
```

| Flag                                  | Purpose                                                                                           |
| ------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `-i` / `--install_dependencies`       | Installs all `extensionDependencies` (including the language pack) into the test VS Code instance |
| `-L <locale>` / `--locale <locale>`   | Launches VS Code with the given display language                                                  |
| `-e <dir>` / `--extensions_dir <dir>` | Directory where extensions are installed — **must be the same for both flags**                    |

> **Note:** `-i` and `-L` must be used together. `-i` installs the pack so it is registered; `-L` tells VS Code to use it. Without `-i`, the pack is not present and VS Code falls back to English. Without `-L`, VS Code starts in English even if the pack is installed.

---

## npm script example

```json
{
  "scripts": {
    "ui-test": "extest setup-and-run './out/test/**/*.test.js' -i -L ru -e ./test-extensions -r .",
    "ui-test:en": "extest setup-and-run './out/test/**/*.test.js' -i -e ./test-extensions -r ."
  }
}
```

It is good practice to keep your default `ui-test` script language-neutral and add a separate locale-specific variant only where needed, rather than hardcoding a locale for all test runs.

---

## Programmatic API

Use the `locale` field in `RunOptions`:

```typescript
import { ExTester } from "vscode-extension-tester";

const exTester = new ExTester();

await exTester.setupAndRunTests(
  "./out/test/**/*.test.js",
  "latest",
  {
    installDependencies: true, // installs extensionDependencies, including the language pack
  },
  {
    resources: ["."],
    locale: "ru", // launches VS Code in Russian
  },
);
```

Or install the language pack explicitly without using `extensionDependencies`:

```typescript
await exTester.installFromMarketplace("ms-ceintl.vscode-language-pack-es");

await exTester.runTests("./out/test/**/*.test.js", {
  resources: ["."],
  locale: "ru",
});
```

---

## CI example (GitHub Actions)

No extra install step is needed in CI. The `-i` flag handles installation through the test VS Code binary, which is the correct isolated instance:

```yaml
- name: 🔍 Run localized tests
  run: extest setup-and-run './out/test/**/*.test.js' -i -L ru -e ./test-extensions -r .
```

> **Do not** use `code --install-extension` in CI to install language packs — that installs into whatever system VS Code binary is on the PATH, not the isolated test instance that ExTester downloads and manages.

---

## Troubleshooting

**VS Code still launches in English after setting `-L ru`**

1. Make sure `-i` is also present — the language pack must be installed into the test extensions directory.
2. Make sure `-e <dir>` is consistent between setup and run — both the install command and the launch command must reference the same extensions directory.
3. Check that the language pack was actually downloaded: look for a `ms-ceintl.vscode-language-pack-<locale>-*` directory inside your `-e` folder after setup runs.

**Language pack is installed but locale code doesn't match**

The locale code passed to `-L` must match the locale string the language pack declares. Russian is `ru`, Simplified Chinese is `zh-cn` (not `zh-hans`). Check the extension's `package.json` → `contributes.localizations[0].languageId` for the exact string.
