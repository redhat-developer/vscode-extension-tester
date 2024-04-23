![toolbar](https://user-images.githubusercontent.com/4181232/122540755-3bc5fe00-d029-11eb-8b74-77ee740acdad.png)

#### Lookup

```typescript
// get a handle for existing toolbar (i.e. debug session needs to be in progress)
const bar = await DebugToolbar.create();
```

#### Buttons

```typescript
// continue
await bar.continue();
// pause
await bar.pause();
// step over
await bar.stepOver();
// step into
await bar.stepInto();
// step out
await bar.stepOut();
// restart
await bar.restart();
// stop
await bar.stop();
```

#### Wait for code to pause again

```typescript
await bar.waitForBreakPoint();
```
