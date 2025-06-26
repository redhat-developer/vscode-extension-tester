#!/usr/bin/env node
/**
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License", destination); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { program } from 'commander';
import { ExTester } from './extester';
import { ReleaseQuality } from './util/codeUtil';
import { loadConfig } from './config';
import type { IPackageOptions } from '@vscode/vsce';
import type { ExTesterConfig } from './config';
import pjson from '../package.json';

/**
 * Parses a JSON string from the --package_options CLI flag into an IPackageOptions object.
 * Exported for unit testing.
 */
export function parsePackageOptions(json: string | undefined): IPackageOptions | undefined {
	if (!json) {
		return undefined;
	}
	try {
		return JSON.parse(json) as IPackageOptions;
	} catch {
		throw new Error(`--package_options: invalid JSON: ${json}`);
	}
}

/**
 * Resolves the final test file list from CLI positional args and/or config.
 * CLI args take precedence; config.run.testFiles is used as fallback.
 * Throws when neither source provides test files.
 */
function resolveTestFiles(cliFiles: string[], config: ExTesterConfig): string[] {
	if (cliFiles && cliFiles.length > 0) {
		return cliFiles;
	}
	if (config.run?.testFiles && config.run.testFiles.length > 0) {
		return config.run.testFiles;
	}
	throw new Error('No test files specified. Provide glob pattern(s) as arguments or set run.testFiles in extester.config.json.');
}

program.version(pjson.version).description('UI Test Runner for VS Code Extension');

program
	.command('get-vscode')
	.description('Download VS Code for testing')
	.option('-s, --storage <storage>', 'Use this folder for all test resources')
	.option('-c, --code_version <version>', 'Version of VS Code to download, use `min`/`max` to download the oldest/latest VS Code supported by ExTester')
	.option('-t, --type <type>', 'Type of VS Code release (stable/insider)')
	.option('-n, --no_cache', 'Skip using cached version and download fresh copy without caching it', false)
	.option('--config <path>', 'Path to extester.config.json configuration file')
	.action(
		withErrors(async (cmd) => {
			const cfg = await loadConfig(cmd.config);
			const setup = cfg.setup ?? {};
			const extest = new ExTester(cmd.storage ?? setup.storage, codeStream(cmd.type ?? setup.type));
			await extest.downloadCode(cmd.code_version ?? setup.vscodeVersion, cmd.no_cache || setup.noCache);
		}),
	);

program
	.command('get-chromedriver')
	.description('Download ChromeDriver binary')
	.option('-s, --storage <storage>', 'Use this folder for all test resources')
	.option(
		'-c, --code_version <version>',
		'Version of VS Code you want to run with the ChromeDriver, use `min`/`max` to download the oldest/latest VS Code supported by ExTester',
	)
	.option('-t, --type <type>', 'Type of VS Code release (stable/insider)')
	.option('-n, --no_cache', 'Skip using cached version and download fresh copy without caching it', false)
	.option('--config <path>', 'Path to extester.config.json configuration file')
	.action(
		withErrors(async (cmd) => {
			const cfg = await loadConfig(cmd.config);
			const setup = cfg.setup ?? {};
			const extest = new ExTester(cmd.storage ?? setup.storage, codeStream(cmd.type ?? setup.type));
			await extest.downloadChromeDriver(cmd.code_version ?? setup.vscodeVersion, cmd.no_cache || setup.noCache);
		}),
	);

program
	.command('install-vsix')
	.description('Install extension from vsix file into test instance of VS Code')
	.option('-s, --storage <storage>', 'Use this folder for all test resources')
	.option('-e, --extensions_dir <extensions_directory>', 'VS Code will use this directory for managing extensions')
	.option('-f, --vsix_file <file>', 'path/URL to vsix file containing the extension')
	.option('--package_options <json>', 'JSON string of vsce IPackageOptions passed to vsce.createVSIX() (e.g. \'{"useYarn":true,"followSymlinks":true}\')')
	.option('-t, --type <type>', 'Type of VS Code release (stable/insider)')
	.option('-i, --install_dependencies', 'Automatically install extensions your extension depends on', false)
	.option('--config <path>', 'Path to extester.config.json configuration file')
	.action(
		withErrors(async (cmd) => {
			const cfg = await loadConfig(cmd.config);
			const setup = cfg.setup ?? {};
			const extest = new ExTester(cmd.storage ?? setup.storage, codeStream(cmd.type ?? setup.type), cmd.extensions_dir ?? setup.extensionsDir);
			const packageOptions = parsePackageOptions(cmd.package_options) ?? setup.packageOptions;
			await extest.installVsix({
				vsixFile: cmd.vsix_file,
				packageOptions,
				installDependencies: cmd.install_dependencies || setup.installDependencies,
			});
		}),
	);

program
	.command('install-from-marketplace <id> [ids...]')
	.description('Install extension from marketplace with given <id> into test instance of VS Code')
	.option('-s, --storage <storage>', 'Use this folder for all test resources')
	.option('-e, --extensions_dir <extensions_directory>', 'VS Code will use this directory for managing extensions')
	.option('-t, --type <type>', 'Type of VS Code release (stable/insider)')
	.option('-p, --pre_release', 'Installs the pre-release version of the extension')
	.option('--config <path>', 'Path to extester.config.json configuration file')
	.action(
		withErrors(async (id, ids, cmd) => {
			const cfg = await loadConfig(cmd.config);
			const setup = cfg.setup ?? {};
			const extest = new ExTester(cmd.storage ?? setup.storage, codeStream(cmd.type ?? setup.type), cmd.extensions_dir ?? setup.extensionsDir);
			await extest.installFromMarketplace(id, cmd.pre_release);
			if (ids && ids.length > 0) {
				for (const idx of ids) {
					await extest.installFromMarketplace(idx, cmd.pre_release);
				}
			}
		}),
	);

program
	.command('setup-tests')
	.description('Set up all necessary requirements for tests to run')
	.option('-s, --storage <storage>', 'Use this folder for all test resources')
	.option('-e, --extensions_dir <extensions_directory>', 'VS Code will use this directory for managing extensions')
	.option('-c, --code_version <version>', 'Version of VS Code to download, use `min`/`max` to download the oldest/latest VS Code supported by ExTester')
	.option('-t, --type <type>', 'Type of VS Code release (stable/insider)')
	.option('--package_options <json>', 'JSON string of vsce IPackageOptions passed to vsce.createVSIX() (e.g. \'{"useYarn":true,"followSymlinks":true}\')')
	.option('-i, --install_dependencies', 'Automatically install extensions your extension depends on', false)
	.option('-n, --no_cache', 'Skip using cached version and download fresh copy without caching it', false)
	.option('--config <path>', 'Path to extester.config.json configuration file')
	.action(
		withErrors(async (cmd) => {
			const cfg = await loadConfig(cmd.config);
			const setup = cfg.setup ?? {};
			const extest = new ExTester(cmd.storage ?? setup.storage, codeStream(cmd.type ?? setup.type), cmd.extensions_dir ?? setup.extensionsDir);
			const packageOptions = parsePackageOptions(cmd.package_options) ?? setup.packageOptions;
			await extest.setupRequirements({
				vscodeVersion: cmd.code_version ?? setup.vscodeVersion,
				packageOptions,
				installDependencies: cmd.install_dependencies || setup.installDependencies,
				noCache: cmd.no_cache || setup.noCache,
			});
		}),
	);

program
	.command('run-tests [testFiles...]')
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
	.option('-C, --coverage', 'Enable code coverage using c8')
	.option('-r, --open_resource <resources...>', 'Open resources in VS Code. Multiple files and folders can be specified.')
	.option('-p, --custom_page_objects <path>', 'Path to a compiled JS locator contribution file for custom page objects')
	.option('--config <path>', 'Path to extester.config.json configuration file')
	.option('-L, --locale <locale>', 'to be defined')
	.action(
		withErrors(async (testFiles, cmd) => {
			const cfg = await loadConfig(cmd.config);
			const run = cfg.run ?? {};
			const files = resolveTestFiles(testFiles, cfg);
			const extest = new ExTester(
				cmd.storage ?? run.storage,
				codeStream(cmd.type ?? run.type),
				cmd.extensions_dir ?? run.extensionsDir,
				cmd.coverage ?? run.coverage,
			);
			const customPageObjectsPath = cmd.custom_page_objects ?? run.customPageObjects;
			await extest.runTests(files, {
				vscodeVersion: cmd.code_version ?? run.vscodeVersion,
				settings: cmd.code_settings ?? run.settings,
				cleanup: cmd.uninstall_extension || run.cleanup,
				config: cmd.mocha_config ?? run.mochaConfig,
				logLevel: cmd.log_level ?? run.logLevel,
				offline: cmd.offline || run.offline,
				resources: cmd.open_resource ?? run.resources ?? [],
				customPageObjects: customPageObjectsPath ? { locatorsPath: customPageObjectsPath } : undefined,
				locale: cmd.locale,
			});
		}),
	);

program
	.command('setup-and-run [testFiles...]')
	.description('Perform all setup and run tests specified by glob pattern(s)')
	.option('-s, --storage <storage>', 'Use this folder for all test resources')
	.option('-e, --extensions_dir <extensions_directory>', 'VS Code will use this directory for managing extensions')
	.option('-c, --code_version <version>', 'Version of VS Code to download, use `min`/`max` to download the oldest/latest VS Code supported by ExTester')
	.option('-t, --type <type>', 'Type of VS Code release (stable/insider)')
	.option('-o, --code_settings <settings.json>', 'Path to custom settings for VS Code json file')
	.option('--package_options <json>', 'JSON string of vsce IPackageOptions passed to vsce.createVSIX() (e.g. \'{"useYarn":true,"followSymlinks":true}\')')
	.option('-u, --uninstall_extension', 'Uninstall the extension after the test run', false)
	.option('-m, --mocha_config <mocharc.js>', 'Path to Mocha configuration file')
	.option('-i, --install_dependencies', 'Automatically install extensions your extension depends on', false)
	.option('-l, --log_level <level>', 'Log messages from webdriver with a given level', 'Info')
	.option('-f, --offline', 'Attempt to run without internet connection, make sure to have all requirements downloaded', false)
	.option('-C, --coverage', 'Enable code coverage using c8')
	.option('-r, --open_resource <resources...>', 'Open resources in VS Code. Multiple files and folders can be specified.')
	.option('-n, --no_cache', 'Skip using cached version and download fresh copy without caching it', false)
	.option('-p, --custom_page_objects <path>', 'Path to a compiled JS locator contribution file for custom page objects')
	.option('--config <path>', 'Path to extester.config.json configuration file')
	.option('-L, --locale <locale>', 'to be defined')
	.action(
		withErrors(async (testFiles, cmd) => {
			const cfg = await loadConfig(cmd.config);
			const setup = cfg.setup ?? {};
			const run = cfg.run ?? {};
			const files = resolveTestFiles(testFiles, cfg);
			const extest = new ExTester(
				cmd.storage ?? setup.storage ?? run.storage,
				codeStream(cmd.type ?? setup.type ?? run.type),
				cmd.extensions_dir ?? setup.extensionsDir ?? run.extensionsDir,
				cmd.coverage ?? run.coverage,
			);
			const packageOptions = parsePackageOptions(cmd.package_options) ?? setup.packageOptions;
			const customPageObjectsPath = cmd.custom_page_objects ?? run.customPageObjects;
			await extest.setupAndRunTests(
				files,
				cmd.code_version ?? setup.vscodeVersion ?? run.vscodeVersion,
				{
					packageOptions,
					installDependencies: cmd.install_dependencies || setup.installDependencies,
					noCache: cmd.no_cache || setup.noCache,
				},
				{
					settings: cmd.code_settings ?? run.settings,
					cleanup: cmd.uninstall_extension || run.cleanup,
					config: cmd.mocha_config ?? run.mochaConfig,
					logLevel: cmd.log_level ?? run.logLevel,
					resources: cmd.open_resource ?? run.resources ?? [],
					customPageObjects: customPageObjectsPath ? { locatorsPath: customPageObjectsPath } : undefined,
					locale: cmd.locale,
				},
			);
		}),
	);

// Only parse argv when running as the CLI binary, not when imported (e.g. in unit tests)
if (require.main === module) {
	program.parse(process.argv);
}

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
	};
}

function codeStream(stream: string | undefined) {
	const envType = process.env.CODE_TYPE;
	let type = stream;

	if (!type && envType) {
		type = envType;
	}
	if (type?.toLowerCase() === 'insider') {
		return ReleaseQuality.Insider;
	}
	return ReleaseQuality.Stable;
}
