![extSection](https://user-images.githubusercontent.com/4181232/65507937-53f9ff00-decf-11e9-8fd8-093b350cf547.png)

Section in the Extensions view. Unlike the other section types, extension sections behave differently.

#### Lookup

Get a section handle from an open side bar.

```typescript
import { SideBarView, ExtensionsViewSection } from 'vscode-extension-tester';
...
// in this case the cast is required if you wish to use all the available functionality
const section = await new SideBarView().getContent().getSection('enabled') as ExtensionsViewSection;
```

#### Finding Items

Item lookup behaves in a completely different way to the tree sections. In this case it is based on the search bar on top of the view and as such is able to find items beyond the initial section. In this case you will need to manually clear the search bar in order to gain back access to the original section.

```typescript
// get all visible items inside the section
const items = await section.getVisibleItems();

// find an extension anywhere (including the marketplace)
const item = await section.findItem("npm");
// clear the search bar so the original section reappears
await section.clearSearch();

// find an extension in the installed section
const item2 = await section.findItem("@installed java");
// clear the search bar so the original section reappears
await section.clearSearch();

// open an item in the editor view
await section.openItem("@installed java");
```

#### ExtensionsViewItem

![extension](https://user-images.githubusercontent.com/4181232/65508733-24e48d00-ded1-11e9-9f53-1e47e8d79943.png)

Item representing an extension in the extensions view.

##### Get information about the extension

```typescript
// get title
const title = await item.getTitle();

// get version
const version = await item.getVersion();

// get author
const author = await item.getAuthor();

// get description
const description = await item.getDescription();

// find if it is installed
const installed = await item.isInstalled();
```

##### Operations

```typescript
// manage the item - open its context menu
const menu = await item.manage();

// install the extension
await item.install();
```
