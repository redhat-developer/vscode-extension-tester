# ExTester — AI Agent Instructions

## Project Identity

**ExTester** (`vscode-extension-tester`) is a UI testing framework for Visual Studio Code extensions.
It automates launching a real VS Code instance via Selenium WebDriver, installing extensions, and
running Mocha tests against the live UI.

- **GitHub:** https://github.com/redhat-developer/vscode-extension-tester
- **NPM (main):** https://www.npmjs.com/package/vscode-extension-tester
- **NPM (page-objects):** https://www.npmjs.com/package/@redhat-developer/page-objects
- **NPM (locators):** https://www.npmjs.com/package/@redhat-developer/locators
- **VS Code Marketplace:** https://marketplace.visualstudio.com/items?itemName=redhat.extester-runner
- **Example project:** https://github.com/redhat-developer/vscode-extension-tester-example

---

## Monorepo Layout

This is a **Lerna monorepo** with npm workspaces. Each package is versioned independently.

```
packages/
  extester/          vscode-extension-tester   Main CLI + library. Orchestrates VS Code download,
                                               ChromeDriver setup, VSIX install, and test execution.
  page-objects/      @redhat-developer/page-objects  Page Object Model for VS Code UI components.
                                               Exposes typed classes for every VS Code UI surface.
  locators/          @redhat-developer/locators      Version-specific XPath/CSS selectors for each
                                               supported VS Code release (lib/1.X.Y.ts files).
  extester-runner/   extester-runner (private)  VS Code extension with UI for running/viewing tests.
                                               Published to VS Code Marketplace, not NPM.

tests/
  test-project/      Dummy VS Code extension used as the integration test suite for the framework.
```

### Package dependency graph

```
extester-runner
    └─► vscode-extension-tester (extester)
            ├─► @redhat-developer/page-objects
            │       └─► selenium-webdriver
            └─► @redhat-developer/locators
                    └─► @redhat-developer/page-objects (peer)
```

---

## Architecture

### Runtime execution flow

```
ExTester.setupAndRunTests()
  ├── CodeUtil.downloadVSCode()       → downloads VS Code binary to storageFolder
  ├── DriverUtil.downloadChromeDriver() → downloads matching ChromeDriver
  ├── CodeUtil.packageExtension()     → runs vsce package → .vsix
  ├── CodeUtil.installExtension()     → installs .vsix into test VS Code instance
  └── CodeUtil.runTests()             → forks Mocha process with Selenium WebDriver
          └── WebDriver → VS Code (Chromium)
                  └── PageObjects (page-objects package)
                          └── Locators (locators package, version-resolved at runtime)
```

### Locator versioning

Each supported VS Code version has a `packages/locators/lib/1.X.Y.ts` file.
- **Base file** (`1.37.0.ts`): exports the full `Locators` object with every selector.
- **Diff files** (all later versions): export only a `LocatorDiff` with the selectors that changed.
- At runtime, `page-objects` merges diffs from the base up to the running VS Code version.
- File names must match VS Code semver exactly. Resolution falls back to the nearest lower version.

### Page Object Model

`packages/page-objects` exposes component classes for every VS Code UI surface:
menus, activity bar, sidebar/tree views, editors, bottom bar views, dialogs, status bar, workbench.
All classes extend `AbstractElement` (backed by `selenium-webdriver`).

Page objects read element state via `WebElement.getAttribute()` **on purpose**. It is not
deprecated in the selenium-webdriver JS binding, and its hybrid semantics (attribute value with
property fallback, boolean normalization, special-cased `class`/`readonly`) are exactly what the
page objects rely on when reading `aria-*` attributes, class names and input values. Do not
bulk-migrate these calls to `getDomAttribute()`/`getDomProperty()` — those are W3C-precise APIs
with different semantics and such a migration silently changes behavior. Use them only in new
code where a W3C-precise read is specifically wanted.

---

## Key Technical Conventions

| Convention | Rule |
|---|---|
| TypeScript | `strict: true`, `module: Node16`, `target: ES2023` |
| Formatting | ESLint flat config + Prettier — **never format manually** |
| Commits | **Conventional Commits** required and enforced in CI (`feat`, `fix`, `chore`, `docs`, `refactor`) |
| DCO | Every commit must be signed off: `git commit -s` — **no exceptions** |
| VS Code versions | **Do not hardcode version strings.** Use `VSCODE_VERSION_MIN` / `VSCODE_VERSION_MAX` from `packages/extester/src/extester.ts` |
| Build artifacts | **Do not edit `out/` directories** — they are compiled outputs |
| Locator XPaths | **Do not write XPath strings in tests.** Always use the page-objects locator API |
| Element attributes | **Do not migrate `getAttribute()` to `getDomAttribute()`/`getDomProperty()`** — see the Page Object Model section |
| Root dependencies | **Do not add runtime deps to the root `package.json`** — root is dev tooling only |

### VS Code version support policy

ExTester maintains support for the **latest 3 stable VS Code releases** via a rolling window.
This is automated — a CI workflow (`update-vscode-versions.yml`) opens PRs when new versions drop.
Maintainers review, wait for CI green, and merge.

---

## Common Commands

```bash
# Install all workspace dependencies
npm install

# Build all packages (Lerna)
npm run build

# Build only packages changed since last build
npm run build:changed

# Full build + UI test cycle (most common for contributors)
npm run test:build

# Run UI tests only (requires prior build)
npm test

# ExTester Runner unit tests
npm run test:runner:unit

# Lint + autofix (run inside each package directory)
eslint --fix src
```

---

## Documentation (`docs-site/`)

The `docs-site/` directory holds the **canonical public documentation** — an Astro Starlight
site automatically deployed to
[GitHub Pages](https://redhat-developer.github.io/vscode-extension-tester/) via CI
(`.github/workflows/deploy-docs.yml`). Content lives in `docs-site/src/content/docs/` as
Markdown with a `title:` frontmatter; kebab-case filenames map to URL slugs. The build fails on
broken internal links (starlight-links-validator), and PRs touching `docs-site/` get a build
check. `docs-site/` is intentionally NOT an npm workspace and is excluded from Prettier
(root Prettier has no Astro/MDX v3 support — do not remove it from `.prettierignore`).

The legacy `docs/` directory is only the source for GitHub Wiki redirect stubs
(published by `.github/workflows/publish-wiki.yml`) — never add real content there.

**When making any change that affects behaviour, API surface, configuration, or usage — update
the relevant `docs-site/` page(s) in the same PR. Documentation is not optional.**

Key pages (under `docs-site/src/content/docs/`):
- `index.mdx` — landing page
- `getting-started/supported-versions.md` — VS Code / Node.js support policy
- `guides/test-setup.md` — how to configure and run tests (CLI, env vars, extester.config.json)
- `getting-started/writing-simple-tests.md` — first test walkthrough
- `objects/index.mdx` — page object API overview
- `guides/mocha-configuration.md` — Mocha options
- `guides/automated-version-updates.md` — VS Code version automation
- `guides/debugging-tests.md` — debugging failing tests
- `guides/taking-screenshots.md` — screenshot capture
- `objects/<area>/<component-name>.md` — one doc per page object component (40+ files),
  grouped by UI area; the sidebar group is autogenerated from the directory

When adding a new page object component, create a corresponding
`objects/<area>/<component-name>.md` (the sidebar picks it up automatically).
When changing CLI flags, update `guides/test-setup.md`.
When changing VS Code version support, update `guides/automated-version-updates.md` and
`getting-started/supported-versions.md`.
