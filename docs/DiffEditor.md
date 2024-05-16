![diff](https://user-images.githubusercontent.com/4181232/77437498-04947d00-6de5-11ea-9d8e-d41dd5440a78.png)

#### Lookup

```typescript
// through editors view
const diffEditor1 = await new EditorView().openEditor("editorTitle");

// directly
const diffEditor2 = new DiffEditor();
```

#### Working with the Contents

Since diff editor is basicaly two text editors in one, the `DiffEditor` object gives you the ability to work with two editors:

```typescript
// get the original editor
const original = await diffEditor1.getOriginalEditor();

// get the modified editor
const changed = await diffEditor1.getModifiedEditor();
```
