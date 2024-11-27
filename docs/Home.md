# ExTester

ExTester is a package designed to help you run UI tests for your VS Code extensions using selenium-webdriver.
Simply install it into your extension devDependencies to get started:

`npm install --save-dev vscode-extension-tester`

As such there are two major parts to the project:

## Test Setup

The first part automates all the steps necessary to launch UI tests of your VSCode extension:

- Download a test instance of VS Code
- Download the appropriate version of ChromeDriver
- Package and install your extension into the VS Code instance
- Launch the VS Code instance using webdriver
- Run your tests

Find more about the test setup: [[Test-Setup]]

See how to change the Mocha test runner configuration: [[Mocha-Configuration]] and
also how to enable code coverage using the c8 tool [[CodeCoverage]]

Once the setup is complete, check out the sample test file: [[Writing-Simple-Tests]].

Debugging UI tests from VSCode: [[Debugging-Tests]]

---

## Page Object APIs

Once your tests are set up and running, you may use the convenient page object API to handle parts of VSCode without sifting through its DOM. Though, if using pure webdriver is preferred, all the webdriver APIs are exported as well.

Find documentation about the Page Object APIs: [[Page-Object-APIs]].

---

## Opening Files and Folders

Opening files and folders is basic functionality of VS Code.

Since 4.2.0, the most convenient way to open files and folders is the `openResources` method in `VSBrowser`. Use it to open potentially multiple folders or files at the same time (method also waits for workbench to refresh). Files are opened in the editor, single folder will be opened directly in the explorer, multiple folders will be opened as a multi-workspace.

It is recommended to use absolute paths, relative paths are based on process' cwd.

```typescript
await VSBrowser.instance.openResources(`${path/to/folder1}`, ${path/to/file1}, ${path/to/folder2})
```

### Using Dialogs

As of vscode 1.50 files/folders can be opened using the Simple Dialog, which uses an input box to select paths.
If you are running ExTester 4.2.0 or newer, the Simple Dialog is enabled by default. On older versions, make sure to use the following settings.

```plain
Files > Simple Dialog > Enable: True
Window > Dialog Style: Custom
```

You can also pass in custom options JSON file to the command that runs the tests using the `-o` flag. The property names are as follows:

```json
{
  "files.simpleDialog.enable": true,
  "window.dialogStyle": "custom"
}
```

Invoking the open dialog (e.g. via `File > Open Folder...`) then opens an input box. To open a folder, you can use the following code:

```typescript
const input = await InputBox.create();
await input.setText("/path/to/your/folder/");
await input.confirm();
```

Make sure to use a trailing separator for folders, otherwise confirming will only autocorrect the path and you'll need to call it again.
