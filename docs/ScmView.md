![scm](https://user-images.githubusercontent.com/4181232/83526397-af60a000-a4e6-11ea-9f3f-c628a866ace3.png)

#### Lookup

The best way to open the view is to use the activity bar on the left. It might take a second for the view to initialize, so make sure to account for it.

```typescript
view = (await new ActivityBar().getViewControl("Source Control").openView()) as ScmView;
```

#### Actions

In an SCM view we can do two things: initialize a repository if none exists, or retrieve the scm providers open in the current workspace:

```typescript
// get a provider (repository) by title
const provider = await view.getProvider("vscode-extension-tester");
// get all providers (useful if you have multiple repositories open)
const providers = await view.getProviders();
// initialize repository if none is present in current workspace
await view.initializeRepository();
```

### Working with SCM Providers

Each `ScmProvider` object corresponds to a section in the `ScmView`.

#### Info Retrieval

```typescript
// get the title
const title = await provider.getTitle();
// get the type of scm (e.g. git or svn)
const type = await provider.getType();
// get the number of changed files
const changes = await provider.getChangeCount();
```

#### Basic Actions

There are several buttons to push and an input field to fill, which you can do as follows:

```typescript
// click an action button (the buttons are either on the title part on the top for a single repo, or next to the provider title for multiple repos). For instance, refresh:
await provider.takeAction("Refresh");

// click the `More Actions` button to open a context menu with all the available commands
const contextmenu = await provider.openMoreActions();

// Fill in the commit message and make a commit
await provider.commitChanges("Commit message");
```

#### Handling Changes

The displayed changes are represented by the `ScmChange` page object. You can retrieve them from the `ScmProvider`:

```typescript
// get unstaged changes
const changes = await provider.getChanges();

// get staged changes
const staged = await provider.getChanges(true);
```

### Working with SCM Changes

Lets look at how to handle the tree items in the SCM View, using `ScmChange` page objects.

```typescript
const change = changes[0];

// get the label (file name)
const label = await change.getLabel();
// get description (if available, e.g. path in hierarchical display)
const description = await change.getDescription();
// get git status (e.g. 'Modified', 'Untracked', etc.)
const status = await change.getStatus();
// find if the item is expanded (only makes sense in hierarchical display)
const expanded = await change.isExpanded();

// toggle expand state to whichever you like, works only for folders in hierarchical display
await change.toggleExpand(true); // or false to collapse it :)

// use on of the action buttons for the item, e.g. stage
await change.takeAction("Stage Changes");
```
