#!/usr/bin/env node

import * as program from 'commander';
import { ExTester } from './extester';
const pjson = require('../package.json');

program.version(pjson.version)
    .description('VSCode Extension UI Test Runner');

program.command('get-vscode')
    .description('Download VSCode for testing')
    .option('-s, --storage <storage>', 'Use this folder for all test resources')
    .option('-V, --code_version <version>', 'Version of VSCode to download')
    .option('-t, --type <type>', 'Type of VSCode release (stable/insider)')
    .action(async (cmd) => {
        const extest = new ExTester(cmd.storage);
        await extest.downloadCode(cmd.code_version, cmd.type);
    });

program.command('get-chromedriver')
    .description('Download ChromeDriver binary')
    .option('-s, --storage <storage>', 'Use this folder for all test resources')
    .option('-V, --code_version <version>', 'Version of VSCode you want to run with the CromeDriver')
    // .option('-t, --type <type>', 'Type of VSCode release (stable/insider)')
    .action(async (cmd) => {
        const extest = new ExTester(cmd.storage);
        await extest.downloadChromeDriver(cmd.code_version);
    });

program.command('install-vsix')
    .description('Install extension from vsix file into test instance of VSCode')
    .option('-s, --storage <storage>', 'Use this folder for all test resources')
    .option('-f, --vsix_file <file>', 'vsix file containing the extension')
    .action((cmd) => {
        const extest = new ExTester(cmd.storage);
        extest.installVsix(cmd.vsix_file);
    });

program.command('setup-tests')
    .description('Set up all necessary requirements for tests to run')
    .option('-s, --storage <storage>', 'Use this folder for all test resources')
    .option('-V, --code_version <version>', 'Version of VSCode to download')
    .option('-t, --type <type>', 'Type of VSCode release (stable/insider)')
    .action(async (cmd) => {
        const extest = new ExTester(cmd.storage);
        await extest.setupRequirements(cmd.code_version, cmd.type);
    });

program.command('run-tests <testFiles>')
    .description('Run the test files specified by a glob pattern')
    .option('-s, --storage <storage>', 'Use this folder for all test resources')
    .action((testFiles, cmd) => {
        const extest = new ExTester(cmd.storage);
        extest.runTests(testFiles);
    });

program.command('setup-and-run <testFiles>')
    .description('Perform all setup and run tests specified by glob pattern')
    .option('-s, --storage <storage>', 'Use this folder for all test resources')
    .option('-V, --code_version <version>', 'Version of VSCode to download')
    .option('-t, --type <type>', 'Type of VSCode release (stable/insider)')
    .action(async (testFiles, cmd) => {
        const extest = new ExTester(cmd.storage);
        await extest.setupAndRunTests(cmd.code_version, cmd.type, testFiles);
    });

program.parse(process.argv);