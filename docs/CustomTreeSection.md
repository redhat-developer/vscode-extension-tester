![customTree](https://user-images.githubusercontent.com/4181232/65507524-6e7fa880-dece-11e9-93a5-e6ead75afc4e.png)

The 'custom' tree section, usually contributed by extensions as TreeView. All The behaviour is defined by the general [[ViewSection]] class.

#### Lookup
```typescript
import { SideBarView, CustomTreeSection } from 'vscode-extension-tester';
...
// Type is inferred automatically, the type cast here is used to be more explicit
const section = await new SideBarView().getContent().getSection('servers') as CustomTreeSection;
```

#### Get Welcome Content
Some sections may provide a welcome content when their tree is empty.
```typescript
// find welcome content, return undefined if not present
const welcome: WelcomeContentSection = await section.findWelcomeContent();

// get all the possible buttons and paragraphs in a list
const contents = await welcome.getContents();

// get all buttons 
const btns = await welcome.getButtons();

// get paragraphs as strings in a list
const text = await welcome.getTextSections();
```