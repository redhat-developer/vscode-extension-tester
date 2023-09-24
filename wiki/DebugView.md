![debugview](https://user-images.githubusercontent.com/4181232/122539414-e0dfd700-d027-11eb-9c72-f1745d7bb3c7.png)

#### Lookup
```typescript
// open the view using the icon in the view container
const btn = await new ActivityBar().getViewControl('Run');
const debugView = (await btn.openView()) as DebugView;
```

#### Launch Configurations
```typescript
// get title of current launch configuration
const config = await debugView.getLaunchConfiguration();
// get titles of all available laynch configurations
const configs = await debugView.getLaunchConfigurations();
// select launch configuration by title
await debugConfiguration.selectLaunchConfiguration('Test Launch');
```

#### Launch
```typescript
// start selected launch configuration
await debugView.start();
```