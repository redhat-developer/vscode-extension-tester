---
title: Automated Version Updates
---

## Overview

ExTester automatically maintains support for the latest 3 stable VS Code releases through an automated workflow. This reduces maintenance burden while ensuring the testing framework stays current with VS Code updates.

## How It Works

### Version Window

ExTester supports a **floating window** of the 3 most recent VS Code **minor versions**, always using the latest patch release for each:

```
Example:
┌─────────────────────────────────────────────────┐
│  Min: 1.128.1  (latest patch of 1.128.x)       │
│  Middle: 1.129.0  (latest patch of 1.129.x)    │
│  Max: 1.130.0  (latest patch of 1.130.x)       │
└─────────────────────────────────────────────────┘
```

**When a new minor version is released** (e.g., 1.131.0), the window shifts:

```
New minor version: 1.131.x
┌─────────────────────────────────────────────────┐
│  Min: 1.129.0  (latest patch of 1.129.x)       │
│  Middle: 1.130.0  (latest patch of 1.130.x)    │
│  Max: 1.131.0  (latest patch of 1.131.x)       │
└─────────────────────────────────────────────────┘
```

**When a new patch is released** (e.g., 1.130.1), only that version updates:

```
New patch: 1.130.1
┌─────────────────────────────────────────────────┐
│  Min: 1.128.1  (unchanged)                      │
│  Middle: 1.129.0  (unchanged)                   │
│  Max: 1.130.1  (updated patch)                  │
└─────────────────────────────────────────────────┘
```

### Automation Workflow

The [`.github/workflows/update-vscode-versions.yml`](https://github.com/redhat-developer/vscode-extension-tester/blob/main/.github/workflows/update-vscode-versions.yml) workflow:

1. **Runs weekly** (every Monday at 9 AM UTC)
2. **Fetches** all stable VS Code versions from the official API
3. **Identifies** the latest stable versions needed for the support window
4. **Selects** the latest patch release for each version slot
5. **Compares** with current versions in the repository
6. **Updates** if changes are detected:
   - `packages/extester/package.json` - `vscode-min` and `vscode-max`
7. **Creates a Pull Request** with all changes
8. **Triggers CI tests** against the configured supported versions automatically

## File Updated

### `packages/extester/package.json`

```json
// example values
"supportedVersions": {
  "vscode-min": "1.133.0",  // ← Updated to oldest supported version
  "vscode-max": "1.135.0"   // ← Updated to newest supported version
}
```

These values are used when users run tests with:

- `--code_version=min` - Uses the oldest supported version
- `--code_version=max` - Uses the newest supported version

The CI workflows use the `min`/`max` placeholders directly, so they pick up the new values automatically and need no updating.

## For Maintainers

### Reviewing Auto-Generated PRs

When the workflow creates a PR, you should:

1. **Check the PR description** for version changes
2. **Wait for CI tests** to complete for the configured supported versions
3. **Review test results** for any failures or warnings
4. **Look for breaking changes** in page objects
5. **Merge if all tests pass** ✅

### Manual Trigger

You can manually trigger the workflow:

1. Go to [Actions → 🔄 Sync VS Code version support](https://github.com/redhat-developer/vscode-extension-tester/actions/workflows/update-vscode-versions.yml)
2. Click "Run workflow"
3. Select the branch (usually `main`)
4. Click "Run workflow"

### When Tests Fail

If the automated PR shows test failures:

1. **Review the failure** - Is it a breaking change in VS Code?
2. **Update page objects** if needed to fix compatibility
3. **Push fixes** to the auto-generated PR branch
4. **Re-run tests** to verify fixes
5. **Merge** once tests pass

### Skipping a Version

If a VS Code version has known issues:

1. **Close the auto-generated PR** without merging
2. **Wait for the next release** - the workflow will create a new PR
3. **Document the skip** in an issue for tracking

## For Users

### Using Version Placeholders

Users can specify VS Code versions when running tests:

```bash
# Use the oldest supported version
extest setup-tests --code_version=min

# Use a specific version
extest setup-tests --code_version=1.130.0

# Use the newest supported version
extest setup-tests --code_version=max

# Use the absolute latest (may be untested)
extest setup-tests --code_version=latest
```

### Checking Supported Versions

To see which versions are currently supported:

```bash
# View package.json
cat packages/extester/package.json | grep -A 3 "supportedVersions"
```

Or check the [package.json](https://github.com/redhat-developer/vscode-extension-tester/blob/main/packages/extester/package.json) file directly.

## Troubleshooting

### Workflow Fails

If the automated workflow fails, it will:

- Create an issue with details
- Notify maintainers
- Require manual intervention

**Manual fallback:**

1. Check latest VS Code versions at https://code.visualstudio.com/updates
2. Update `packages/extester/package.json` manually
3. Run tests and create a release

### Version Mismatch

If you notice the supported versions have fallen behind the current VS Code releases:

1. Run the workflow manually to sync versions
2. Or update `packages/extester/package.json` manually

### API Rate Limits

The workflow includes retry logic and runs weekly to avoid rate limits. If you encounter issues:

- Wait a few hours and try again
- Check GitHub Actions status
- Use manual update process as fallback

## Benefits

### For Maintainers

- ✅ **80% less manual work** - No more checking for new versions
- ✅ **No version mismatches** - Version support is updated consistently
- ✅ **Automatic testing** - CI validates the configured supported versions
- ✅ **Clear audit trail** - All changes via PRs

### For Users

- ✅ **Always current** - Support for latest VS Code versions
- ✅ **Predictable** - Published support versions are easy to inspect and use
- ✅ **Flexible** - Can use min/max/latest as needed
- ✅ **Reliable** - Tested before release

## Related Documentation

- [Test Setup](/vscode-extension-tester/guides/test-setup/) - How to set up tests
- [Mocha Configuration](/vscode-extension-tester/guides/mocha-configuration/) - Configuring test runner
- [Contributing](https://github.com/redhat-developer/vscode-extension-tester/blob/main/CONTRIBUTING.md) - How to contribute
