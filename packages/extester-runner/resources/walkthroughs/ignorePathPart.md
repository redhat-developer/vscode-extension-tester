# Shorter folder labels

**Ignore Path Part** removes a leading path segment from the folder labels of the test tree. It only changes the labels, not which tests are found or run.

```json
"extesterRunner.ignorePathPart": "src/"
```

```
Without                         With "src/"
ExTester                        ExTester
├─ src/ui-test                  ├─ ui-test
└─ src/ui-test/editor           └─ ui-test/editor
```
