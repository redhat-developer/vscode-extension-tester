![dialog](https://user-images.githubusercontent.com/4181232/108175328-ec1a0900-7100-11eb-97f5-e9c52ad19c78.png)

Only available if you have the custom dialog style enabled, use `"window.dialogStyle": "custom"` in the settings to do so.

#### Look up

```typescript
const dialog = new ModalDialog();
```

#### Get the contents

```typescript
// get the message (the bold text)
const message = await dialog.getMessage();

// get the details (the not so bold text)
const details = await dialog.getDetails();

// get the button web elements
const buttons = await dialog.getButtons()
```

#### Push a button

```typescript
// push button with a given title
await dialog.pushButton('Save All');
```
