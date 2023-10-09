![item](https://user-images.githubusercontent.com/4181232/56657225-c7d17a80-6697-11e9-8690-5055d6737a7a.png)

#### Lookup
The best way to get an item reference is to use the ```findItem``` method from ```ViewSection```.
```typescript
const viewSection = ...;
const item = await viewSection.findItem('package.json');
```

#### Actions
```typescript
// get item's label
const label = item.getLabel()
// find if the item can be expanded
const isExpandable = await item.isExpandable();
// try to expand the item and find if it has children
const isParent = await item.hasChildren();
// find if item is expanded
const isExpanded = await item.isExpanded();
// collapse the item if expanded
await item.collapse();
// select the item and get its children if it ends up expanded, otherwise get an empty array
const children = await item.select();
// get the tooltip if present
const tooltip = await item.getTooltip();
```