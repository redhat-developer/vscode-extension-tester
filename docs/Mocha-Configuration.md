Since this framework is using Mocha programmatically, we lose certain ways to configure the test runner. We do however support using mocha configuration files, with roughly the same functionality as described in [mochajs documentation](https://mochajs.org/#configuring-mocha-nodejs).

### Configuration Options

Extester supports three formats of mocha config files:

- javascript file (.js)
- json file (.json)
- yaml file (.yml | .yaml)

When using a JS file, make sure the options object is being exported as demonstrated [here](https://github.com/mochajs/mocha/blob/master/example/config/.mocharc.js).

You can check out what options are supported in the [Mocha API documentation](https://mochajs.org/api/mocha). Any invalid mocha options declared will be ignored.

### Loading your Config File

By default, the framework is going to scan the root of your project for files named `.mocharc` with one of the supported extensions (as does Mocha). If multiple files are present, the priority then is `JS (.mocharc.js) > JSON (.mocharc.json) > YAML (.mocharc.yml, .mocharc.yaml)`.

Alternatively, you may use the `-m` flag with the command that runs your tests to specify a different path to your config file. For example

```sh
extest setup-and-run <test-files> -m <path/to/my/config.js>
```

### Type-safe Configuration Files

If you wish to have your configuration type-checked, you can write the configuration in TypeScript using the `MochaOptions` interface. Make sure the .ts file is compiled, then use the `-m` flag to point to the compiled configuration.

An example config.ts file might look like this:

```typescript
import { MochaOptions } from "vscode-extension-tester";

const options: MochaOptions = {
    reporter: 'spec',
    slow: 75,
    timeout: 2000,
    ui: 'bdd'
}

export default options;
```
