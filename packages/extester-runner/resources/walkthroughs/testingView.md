# Your UI tests in the Testing view

ExTester Runner lists the test files that match the **Test File Pattern** in VS Code's **Testing** view, under **ExTester**:

```
ExTester
└─ src/ui-test
   └─ editor.test.ts        .only
      └─ Editor             (describe)
         ├─ opens a file    only
         └─ saves a file    skip
```

- Folders, files, suites and tests (`describe` and `it`, or `suite` and `test` with Mocha's TDD interface), with `only` and `skip` next to marked tests.
- A file that contains `.only` is marked `.only`: running it skips every other test.
- Filter marked tests with `@extesterRunner:only` or `@extesterRunner:skip`.
- The **Screenshots** and **Logs** views are in the same sidebar, below the tests.
