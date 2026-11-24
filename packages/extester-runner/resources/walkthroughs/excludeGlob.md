# Leave paths out of the search

**Exclude Pattern** is a glob of paths that are never searched for tests. Default:

```json
"extesterRunner.excludeGlob": "**/node_modules/**"
```

Leave out more folders with braces, for example compiled output and downloaded test resources:

```json
"extesterRunner.excludeGlob": "{**/node_modules/**,**/out/**,**/test-resources/**}"
```

A narrower search makes the Testing view faster to load in large workspaces.
