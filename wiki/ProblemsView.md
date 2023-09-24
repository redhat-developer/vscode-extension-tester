![problems](https://user-images.githubusercontent.com/4181232/56641152-fe49ce00-6674-11e9-9a5d-096a61c0b835.png)

#### Lookup
```typescript
import { BottomBarPanel, ProblemsView } from 'vscode-extension-tester';
...
const problemsView = await new BottomBarPanel().openProblemsView();
```

#### Set Filter
Fill in a string into the filter box.
```typescript
await problemsView.setFilter('**/filter/glob*');
```

#### Collapse All Markers
```typescript
await problemsView.collapseAll();
```

#### Get Handles to All Markers
```typescript
import { MarkerType } from 'vscode-extension-tester';
...
// get all markers regardless of type
const markers = await problemsView.getAllMarkers(MarkerType.Any);
// get all error markers
const errors = await problemsView.getAllMarkers(MarkerType.Error);
// get all warning markers
const errors = await problemsView.getAllMarkers(MarkerType.Warning);
// get all file markers
const errors = await problemsView.getAllMarkers(MarkerType.File);
```

### Marker
Markers represent items displayed in the problems view.

#### Retrieval
``` typescript
const markers = await problemsView.getAllMarkers(MarkerType.Any);
const marker = markers[0];
```

#### Actions
``` typescript
// get the marker type
const type = await marker.getType();
// get the text of the marker
const text = await marker.getText();
// expand the marker if available
await marker.toggleExpand(true);
// collapse
await marker.toggleExpand(false);
```