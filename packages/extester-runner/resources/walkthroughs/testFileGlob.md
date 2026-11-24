# Find your test files

**Test File Pattern** is a glob, relative to each workspace folder, that matches your UI test files. Default:

```json
"extesterRunner.testFileGlob": "**/ui-test/**/*.test.ts"
```

Examples:

| Your tests                           | Pattern                              |
| ------------------------------------ | ------------------------------------ |
| `src/ui-test/editor.test.ts`         | `src/ui-test/**/*.test.ts`           |
| `test/ui/editor.spec.ts`             | `test/ui/**/*.spec.ts`               |
| `packages/ui-tests/src/a.test.ts`    | `packages/ui-tests/src/**/*.test.ts` |

Match the TypeScript sources, not the compiled files: the tree is built from the sources. The last segment, such as `*.test.ts`, is also the file pattern used when running a folder with **Run Sources**.

The Testing view updates as soon as the setting changes.
