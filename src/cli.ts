#!/usr/bin/env node

import * as program from 'commander';
import { ExTester } from './extester';
import { ReleaseQuality } from './util/codeUtil';
const pjson = require('../package.json');

program.version(pjson.version)
    .description('VSCode Extension UI Test Runner');

program.command('get-vscode')
    .description('Download VSCode for testing')
    .option('-s, --storage <storage>', 'Use this folder for all test resources')
    .option('-c, --code_version <version>', 'Version of VSCode to download')
    .option('-t, --type <type>', 'Type of VSCode release (stable/insider)')
    .action(withErrors(async (cmd) => {
        const extest = new ExTester(cmd.storage, codeStream(cmd.type));
        const version = loadCodeVersion(cmd.code_version);
        await extest.downloadCode(version);
    }));

program.command('get-chromedriver')
    .description('Download ChromeDriver binary')
    .option('-s, --storage <storage>', 'Use this folder for all test resources')
    .option('-c, --code_version <version>', 'Version of VSCode you want to run with the CromeDriver')
    .option('-t, --type <type>', 'Type of VSCode release (stable/insider)')
    .action(withErrors(async (cmd) => {
        const extest = new ExTester(cmd.storage, codeStream(cmd.type));
        const version = loadCodeVersion(cmd.code_version);
        await extest.downloadChromeDriver(version);
    }));

program.command('install-vsix')
    .description('Install extension from vsix file into test instance of VSCode')
    .option('-s, --storage <storage>', 'Use this folder for all test resources')
    .option('-e, --extensions_dir <extensions_directory>', 'VSCode will use this directory for managing extensions')
    .option('-f, --vsix_file <file>', 'path/URL to vsix file containing the extension')
    .option('-y, --yarn', 'Use yarn to build the extension via vsce instead of npm', false)
    .option('-t, --type <type>', 'Type of VSCode release (stable/insider)')
    .action(withErrors(async (cmd) => {
        const extest = new ExTester(cmd.storage, codeStream(cmd.type), cmd.extensions_dir);
        await extest.installVsix({vsixFile: cmd.vsix_file, useYarn: cmd.yarn});
    }));

program.command('install-from-marketplace <id> [ids...]')
    .description('Install extension from marketplace with given <id> into test instance of VSCode')
    .option('-s, --storage <storage>', 'Use this folder for all test resources')
    .option('-e, --extensions_dir <extensions_directory>', 'VSCode will use this directory for managing extensions')
    .option('-t, --type <type>', 'Type of VSCode release (stable/insider)')
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
    .option('-e, --extensions_dir <extensions_directory>', 'VSCode will use this directory for managing extensions')
    .option('-c, --code_version <version>', 'Version of VSCode to download')
    .option('-t, --type <type>', 'Type of VSCode release (stable/insider)')
    .option('-y, --yarn', 'Use yarn to build the extension via vsce instead of npm', false)
    .option('-i, --install_dependencies', 'Automatically install extensions your extension depends on', false)
    .action(withErrors(async (cmd) => {
        const extest = new ExTester(cmd.storage, codeStream(cmd.type), cmd.extensions_dir);
        const vscodeVersion = loadCodeVersion(cmd.code_version);
        await extest.setupRequirements({vscodeVersion, useYarn: cmd.yarn, installDependencies: cmd.install_dependencies});
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
    .option('-l, --log_level <level>', 'Log messages from webdriver with a given level', 'Info')
    .action(withErrors(async (testFiles, cmd) => {
        const extest = new ExTester(cmd.storage, codeStream(cmd.type), cmd.extensions_dir);
        const vscodeVersion = loadCodeVersion(cmd.code_version);
        await extest.runTests(testFiles, {vscodeVersion, settings: cmd.code_settings, cleanup: cmd.uninstall_extension, config: cmd.mocha_config, logLevel: cmd.log_level});
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
    .option('-i, --install_dependencies', 'Automatically install extensions your extension depends on', false)
    .option('-l, --log_level <level>', 'Log messages from webdriver with a given level', 'Info')
    .action(withErrors(async (testFiles, cmd) => {
        const extest = new ExTester(cmd.storage, codeStream(cmd.type), cmd.extensions_dir);
        const vscodeVersion = loadCodeVersion(cmd.code_version);
        await extest.setupAndRunTests(testFiles, vscodeVersion, {useYarn: cmd.yarn, installDependencies: cmd.install_dependencies}, {settings: cmd.code_settings, cleanup: cmd.uninstall_extension, config: cmd.mocha_config, logLevel: cmd.log_level});
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