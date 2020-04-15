#!/usr/bin/env node

import * as program from 'commander';
import { ExTester } from './extester';
const pjson = require('../package.json');

program.version(pjson.version)
    .description('VSCode Extension UI Test Runner');

program.command('get-vscode')
    .description('Download VSCode for testing')
    .option('-s, --storage <storage>', 'Use this folder for all test resources')
    .option('-c, --code_version <version>', 'Version of VSCode to download')
    .option('-t, --type <type>', 'Type of VSCode release (stable/insider)')
    .action(withErrors(async (cmd) => {
        const extest = new ExTester(cmd.storage);
        const version = loadCodeVersion(cmd.code_version);
        await extest.downloadCode(version, cmd.type);
    }));

program.command('get-chromedriver')
    .description('Download ChromeDriver binary')
    .option('-s, --storage <storage>', 'Use this folder for all test resources')
    .option('-c, --code_version <version>', 'Version of VSCode you want to run with the CromeDriver')
    // .option('-t, --type <type>', 'Type of VSCode release (stable/insider)')
    .action(withErrors(async (cmd) => {
        const extest = new ExTester(cmd.storage);
        const version = loadCodeVersion(cmd.code_version);
        await extest.downloadChromeDriver(version);
    }));

program.command('install-vsix')
    .description('Install extension from vsix file into test instance of VSCode')
    .option('-s, --storage <storage>', 'Use this folder for all test resources')
    .option('-e, --extensions_dir <extensions_directory>', 'VSCode will use this directory for managing extensions')
    .option('-f, --vsix_file <file>', 'path/URL to vsix file containing the extension')
    .option('-y, --yarn', 'Use yarn to build the extension via vsce instead of npm', false)
    .action(withErrors(async (cmd) => {
        const extest = new ExTester(cmd.storage, cmd.extensions_dir);
        await extest.installVsix({vsixFile: cmd.vsix_file, useYarn: cmd.yarn});
    }));

program.command('setup-tests')
    .description('Set up all necessary requirements for tests to run')
    .option('-s, --storage <storage>', 'Use this folder for all test resources')
    .option('-e, --extensions_dir <extensions_directory>', 'VSCode will use this directory for managing extensions')
    .option('-c, --code_version <version>', 'Version of VSCode to download')
    .option('-t, --type <type>', 'Type of VSCode release (stable/insider)')
    .option('-y, --yarn', 'Use yarn to build the extension via vsce instead of npm', false)
    .action(withErrors(async (cmd) => {
        const extest = new ExTester(cmd.storage, cmd.extensions_dir);
        const version = loadCodeVersion(cmd.code_version);
        await extest.setupRequirements(version, cmd.type, cmd.yarn);
    }));

program.command('run-tests <testFiles>')
    .description('Run the test files specified by a glob pattern')
    .option('-s, --storage <storage>', 'Use this folder for all test resources')
    .option('-e, --extensions_dir <extensions_directory>', 'VSCode will use this directory for managing extensions')
    .option('-c, --code_version <version>', 'Version of VSCode to be used')
    .option('-t, --type <type>', 'Type of VSCode release (stable/insider)')
    .option('-o, --code_settings <settings.json>', 'Path to custom settings for VS Code json file')
    .option('-u, --uninstall_extension', 'Uninstall the extension after the test run', false)
    .option('-m, --mocha_config', 'Path to Mocha configuration file')
    .action(withErrors(async (testFiles, cmd) => {
        const extest = new ExTester(cmd.storage, cmd.extensions_dir);
        const version = loadCodeVersion(cmd.code_version);
        await extest.runTests(testFiles, version, cmd.type, cmd.code_settings, cmd.uninstall_extension, cmd.mocha_config);
    }));

program.command('setup-and-run <testFiles>')
    .description('Perform all setup and run tests specified by glob pattern')
    .option('-s, --storage <storage>', 'Use this folder for all test resources')
    .option('-e, --extensions_dir <extensions_directory>', 'VSCode will use this directory for managing extensions')
    .option('-c, --code_version <version>', 'Version of VSCode to download')
    .option('-t, --type <type>', 'Type of VSCode release (stable/insider)')
    .option('-o, --code_settings <settings.json>', 'Path to custom settings for VS Code json file')
    .option('-y, --yarn', 'Use yarn to build the extension via vsce instead of npm', false)
    .option('-u, --uninstall_extension', 'Uninstall the extension after the test run', false)
    .option('-m, --mocha_config <mocharc.js>', 'Path to Mocha configuration file')
    .action(withErrors(async (testFiles, cmd) => {
        const extest = new ExTester(cmd.storage, cmd.extensions_dir);
        const version = loadCodeVersion(cmd.code_version);
        await extest.setupAndRunTests(version, cmd.type, testFiles, cmd.code_settings, cmd.yarn, cmd.uninstall_extension, cmd.mocha_config);
    }));

program.parse(process.argv);

function loadCodeVersion(version: string | undefined) {
    const envVersion = process.env.CODE_VERSION;
    if (!version && envVersion) {
        return envVersion;
    }
    return version;
}

function withErrors(command: (...args: any[]) => Promise<void>) {
    return async (...args: any[]) => {
        try {
            await command(...args);
        } catch (err) {
            console.log(err.stack);
            process.exitCode = 1;
        }
    }    
}