#!/usr/bin/env node

import { program } from 'commander';
import { ExTester } from './extester';
import { ReleaseQuality } from './util/codeUtil';
import pjson from '../package.json';

program.version(pjson.version)
    .description('UI Test Runner for VS Code Extension');

program.command('get-vscode')
    .description('Download VS Code for testing')
    .option('-s, --storage <storage>', 'Use this folder for all test resources')
    .option('-c, --code_version <version>', 'Version of VS Code to download, use `min`/`max` to download the oldest/latest VS Code supported by ExTester')
    .option('-t, --type <type>', 'Type of VS Code release (stable/insider)')
    .action(withErrors(async (cmd) => {
        const extest = new ExTester(cmd.storage, codeStream(cmd.type));
        await extest.downloadCode(cmd.code_version);
    }));

program.command('get-chromedriver')
    .description('Download ChromeDriver binary')
    .option('-s, --storage <storage>', 'Use this folder for all test resources')
    .option('-c, --code_version <version>', 'Version of VS Code you want to run with the ChromeDriver, use `min`/`max` to download the oldest/latest VS Code supported by ExTester')
    .option('-t, --type <type>', 'Type of VS Code release (stable/insider)')
    .action(withErrors(async (cmd) => {
        const extest = new ExTester(cmd.storage, codeStream(cmd.type));
        await extest.downloadChromeDriver(cmd.code_version);
    }));

program.command('install-vsix')
    .description('Install extension from vsix file into test instance of VS Code')
    .option('-s, --storage <storage>', 'Use this folder for all test resources')
    .option('-e, --extensions_dir <extensions_directory>', 'VS Code will use this directory for managing extensions')
    .option('-f, --vsix_file <file>', 'path/URL to vsix file containing the extension')
    .option('-y, --yarn', 'Use yarn to build the extension via vsce instead of npm', false)
    .option('-t, --type <type>', 'Type of VS Code release (stable/insider)')
    .option('-i, --install_dependencies', 'Automatically install extensions your extension depends on', false)
    .action(withErrors(async (cmd) => {
        const extest = new ExTester(cmd.storage, codeStream(cmd.type), cmd.extensions_dir);
        await extest.installVsix({vsixFile: cmd.vsix_file, useYarn: cmd.yarn, installDependencies: cmd.install_dependencies});
    }));

program.command('install-from-marketplace <id> [ids...]')
    .description('Install extension from marketplace with given <id> into test instance of VS Code')
    .option('-s, --storage <storage>', 'Use this folder for all test resources')
    .option('-e, --extensions_dir <extensions_directory>', 'VS Code will use this directory for managing extensions')
    .option('-t, --type <type>', 'Type of VS Code release (stable/insider)')
    .action(withErrors(async (id, ids, cmd) => {
        const extest = new ExTester(cmd.storage, codeStream(cmd.type), cmd.extensions_dir);
        await extest.installFromMarketplace(id);
        if (ids && ids.length > 0) {
            for (const idx of ids) {
                await extest.installFromMarketplace(idx);
            }
        }
    }));

program.command('setup-tests')
    .description('Set up all necessary requirements for tests to run')
    .option('-s, --storage <storage>', 'Use this folder for all test resources')
    .option('-e, --extensions_dir <extensions_directory>', 'VS Code will use this directory for managing extensions')
    .option('-c, --code_version <version>', 'Version of VS Code to download, use `min`/`max` to download the oldest/latest VS Code supported by ExTester')
    .option('-t, --type <type>', 'Type of VS Code release (stable/insider)')
    .option('-y, --yarn', 'Use yarn to build the extension via vsce instead of npm', false)
    .option('-i, --install_dependencies', 'Automatically install extensions your extension depends on', false)
    .option('-d, --extension_development_path <extension development directory>', 'VSCode will use the unpackaged extension source from this directory')
    .action(withErrors(async (cmd) => {
        const extest = new ExTester(cmd.storage, codeStream(cmd.type), cmd.extensions_dir, cmd.extension_development_path);
        await extest.setupRequirements({vscodeVersion: cmd.code_version, useYarn: cmd.yarn, installDependencies: cmd.install_dependencies});
    }));

program.command('run-tests <testFiles...>')
    .description('Run the test files specified by glob pattern(s)')
    .option('-s, --storage <storage>', 'Use this folder for all test resources')
    .option('-e, --extensions_dir <extensions_directory>', 'VS Code will use this directory for managing extensions')
    .option('-c, --code_version <version>', 'Version of VS Code to be used, use `min`/`max` to download the oldest/latest VS Code supported by ExTester')
    .option('-t, --type <type>', 'Type of VS Code release (stable/insider)')
    .option('-o, --code_settings <settings.json>', 'Path to custom settings for VS Code json file')
    .option('-u, --uninstall_extension', 'Uninstall the extension after the test run', false)
    .option('-m, --mocha_config <mocharc.js>', 'Path to Mocha configuration file')
    .option('-l, --log_level <level>', 'Log messages from webdriver with a given level', 'Info')
    .option('-f, --offline', 'Attempt to run without internet connection, make sure to have all requirements downloaded', false)
    .option('-d, --extension_development_path <extension development directory>', 'VSCode will use the unpackaged extension source from this directory')
    .option('-r, --open_resource <resources...>', 'Open resources in VS Code. Multiple files and folders can be specified.')
    .action(withErrors(async (testFiles, cmd) => {
        const extest = new ExTester(cmd.storage, codeStream(cmd.type), cmd.extensions_dir, cmd.extension_development_path);
        await extest.runTests(testFiles, {vscodeVersion: cmd.code_version, settings: cmd.code_settings, cleanup: cmd.uninstall_extension, config: cmd.mocha_config, logLevel: cmd.log_level, offline: cmd.offline, resources: cmd.open_resource ?? []});
    }));

program.command('setup-and-run <testFiles...>')
    .description('Perform all setup and run tests specified by glob pattern(s)')
    .option('-s, --storage <storage>', 'Use this folder for all test resources')
    .option('-e, --extensions_dir <extensions_directory>', 'VS Code will use this directory for managing extensions')
    .option('-c, --code_version <version>', 'Version of VS Code to download, use `min`/`max` to download the oldest/latest VS Code supported by ExTester')
    .option('-t, --type <type>', 'Type of VS Code release (stable/insider)')
    .option('-o, --code_settings <settings.json>', 'Path to custom settings for VS Code json file')
    .option('-y, --yarn', 'Use yarn to build the extension via vsce instead of npm', false)
    .option('-u, --uninstall_extension', 'Uninstall the extension after the test run', false)
    .option('-m, --mocha_config <mocharc.js>', 'Path to Mocha configuration file')
    .option('-i, --install_dependencies', 'Automatically install extensions your extension depends on', false)
    .option('-l, --log_level <level>', 'Log messages from webdriver with a given level', 'Info')
    .option('-f, --offline', 'Attempt to run without internet connection, make sure to have all requirements downloaded', false)
    .option('-d, --extension_development_path <extension development directory>', 'VSCode will use the unpackaged extension source from this directory')
    .option('-r, --open_resource <resources...>', 'Open resources in VS Code. Multiple files and folders can be specified.')
    .action(withErrors(async (testFiles, cmd) => {
        const extest = new ExTester(cmd.storage, codeStream(cmd.type), cmd.extensions_dir, cmd.extension_development_path);
        await extest.setupAndRunTests(testFiles, cmd.code_version, {useYarn: cmd.yarn, installDependencies: cmd.install_dependencies}, {settings: cmd.code_settings, cleanup: cmd.uninstall_extension, config: cmd.mocha_config, logLevel: cmd.log_level, resources: cmd.open_resource ?? []});
    }));

program.parse(process.argv);

function withErrors(command: (...args: any[]) => Promise<void>) {
    return async (...args: any[]) => {
        try {
            await command(...args);
        } catch (err) {
            if (err instanceof Error) {
                console.log(err.stack);
            } else {
                console.log(err);
            }
            process.exitCode = 1;
        }
    }    
}

function codeStream(stream: string) {
    const envType = process.env.CODE_TYPE;
    let type = stream;

    if (!type && envType) {
        type = envType;
    }
    if (type && type.toLowerCase() === 'insider') {
        return ReleaseQuality.Insider;
    }
    return ReleaseQuality.Stable;
}
