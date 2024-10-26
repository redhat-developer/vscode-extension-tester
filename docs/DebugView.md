![debug view](https://user-images.githubusercontent.com/4181232/122539414-e0dfd700-d027-11eb-9c72-f1745d7bb3c7.png)

#### Lookup

```typescript
// open the view using the icon in the view container
const btn = await new ActivityBar().getViewControl("Run");
const debugView = (await btn.openView()) as DebugView;
```

#### Launch Configurations

```typescript
// get title of current launch configuration
const config = await debugView.getLaunchConfiguration();
// get titles of all available laynch configurations
const configs = await debugView.getLaunchConfigurations();
// select launch configuration by title
await debugConfiguration.selectLaunchConfiguration("Test Launch");
```

#### Launch

```typescript
// start selected launch configuration
await debugView.start();
```

### Sections

It's possible to work with all individual sections.

#### Variables

![Variables Section](./images/debugView-Variables.png)

```typescript
import { DebugVariableSection } from 'vscode-extension-tester';
...
const variableSection = await debugView.getVariablesSection();
...
await variablesSection?.openItem('Local'); // open section
const var = await variablesSection.findItem('variableName'); // get one variable
const items = await variablesSection.getVisibleItems(); // get all variables
...
const name = var.getVariableName(); // get name
const value = var.getVariableValue(); // get current value
await var.setVariableValue('newValue'); // change value
```

#### Watch

![Watch Section](./images/debugView-WatchSection.png)

```typescript
import { WatchSection } from 'vscode-extension-tester';
...
const watchSection = await debugView.getWatchSection();
...
const items = await watchSection.getVisibleItems(); // get all items
await watchSection.removeAllExpressions(); // remove all expressions
...
await watchSection.addItem('name'); // add new expression
const item = await items.at(num); // get expression at position num
const label = await item.getLabel(); // get label of expression
const value = await item.getValu(); // get value of expression
await item.remove(); // remove expression from watch section
```

#### Call Stack

![Call Stack Section](./images/debugView-CallStack.png)

```typescript
import { CallStackSection } from 'vscode-extension-tester';
...
const callStack = await debugView.getCallStackSection();
...
const items = await callStack.getVisibleItems(); // get all items
...
const item = await items.at(num); // get item at position num
const label = await item.getLabel(); // get label of item
const text = await item.getText(); // get text of item
const btns = await item.getActionButtons(); // get available action buttons
```
