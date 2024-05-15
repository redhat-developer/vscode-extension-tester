![editor](https://user-images.githubusercontent.com/4181232/56643754-81b9ee00-667a-11e9-9c7a-de39f342d676.png)

#### Lookup

```typescript
import { TextEditor, EditorView } from 'vscode-extension-tester';
...
// to look up current editor
const editor = new TextEditor();
// to look up an open editor by name
const editor1 = await new EditorView().openEditor('package.json');
```

#### Text Retrieval

Note: Most text retrieval and editing actions will make use of the clipboard.

```typescript
// get all text
const text = await editor.getText();
// get text at a given line number
const line = await editor.getTextAtLine(1);
// get number of lines in the document
const numberOfLines = await editor.getNumberOfLines();
```

#### Editing Text

```typescript
// replace all text with a string
await editor.setText("my fabulous text");
// replace text at a given line number
await editor.setTextAtLine(1, "my fabulous line");
// type text at the current coordinates
await editor.typeText("I have the best text");
// type text starting at given coordinates (line, column)
await editor.typeTextAt(1, 3, " absolutely");
// format the whole document with built-in tools
await editor.formatDocument();
// get the current cursor coordinates as number array [x,y]
const coords = await editor.getCoordinates();
```

#### Save Changes

```typescript
// find if the editor has changes
const hasChanges = await editor.isDirty();
// save the document
await editor.save();
// save as, this only opens the save prompt
const prompt = await editor.saveAs();
```

#### Get Document File Path

```typescript
const path = await editor.getFilePath();
```

#### Content Assist

```typescript
// open content assist at current position
const contentAssist = await editor.toggleContentAssist(true);
// close content assist
await editor.toggleContentAssist(false);
```

#### Search for Text

```typescript
// get line number that contains some text
const lineNum = await editor.getLineOfText("some text");
// find and select text
await editor.selectText("some text");
// get selected text as string
const text = await editor.getSelectedText();
// get selection block as a page object
const selection = await editor.getSelection();
// open the Find (search) widget
const find = await editor.openFindWidget();
```

#### Breakpoints

```typescript
// toggle breakpoint on a line with given number
await editor.toggleBreakpoint(1);
```

#### CodeLenses

```typescript
// get a code lens by (partial) text
const lens = await editor.getCodeLens("my code lens text");
// get code lens by index (zero-based from the top of the editor)
const firstLens = await editor.getCodeLens(0);
// get all code lenses
const lenses = await editor.getCodeLenses();

// now you can trigger the lens actions by clicking
await lens.click();

// or just get the text
const text = await lens.getText();
const tooltip = await lens.getTooltip();
```
