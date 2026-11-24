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

import * as vscode from 'vscode';
import { Logger } from '../logger/logger';
import { ConfigurationReader } from '../utils/projectConfigFile';
import { getRunnerConfiguration, getConfigArguments } from '../utils/projectConfiguration';
import { buildRunCommand } from '../utils/runCommand';

/**
 * Resolve the task's workspace root and configuration consistently for all run commands.
 * Errors are thrown, not shown: the run commands report them to the user.
 */
export function getTaskConfiguration(resource: vscode.Uri | undefined) {
	const owner = resource ? vscode.workspace.getWorkspaceFolder(resource) : vscode.workspace.workspaceFolders?.[0];
	if (!owner) {
		throw new Error('No workspace folder found.');
	}
	const configuration = getRunnerConfiguration(owner.uri);
	return { owner, configuration, workspaceFolder: owner.uri.fsPath };
}

/**
 * Argument for a value the CLI can also read from the ExTester configuration file. It is passed only
 * when the value does not come from that file, so the file stays the single source of the value and
 * only a VS Code setting overrides it.
 */
function optionArgs(configuration: ConfigurationReader, key: string, option: string, quote = false): string[] {
	const value = configuration.get<string>(key)?.trim();
	if (!value || configuration.isFromConfigFile?.(key)) {
		return [];
	}
	return [option, quote ? `'${value}'` : value];
}

/**
 * Environment variables for a test run: the configured `env` values and, when a single test or
 * `describe` block runs, `MOCHA_GREP`, which ExTester passes to Mocha as its `grep` option.
 *
 * @param {ConfigurationReader} configuration - The runner configuration.
 * @param {string} [grep] - The Mocha `grep` pattern that selects the tests to run.
 * @returns {Record<string, string>} The environment variables to add to the task's environment.
 */
export function getRunEnvironment(configuration: ConfigurationReader, grep?: string): Record<string, string> {
	const configured = configuration.get<Record<string, unknown>>('env') ?? {};
	const env: Record<string, string> = {};
	for (const [name, value] of Object.entries(configured)) {
		if (typeof value !== 'string') {
			throw new TypeError(`The value of the environment variable "${name}" must be a string.`);
		}
		env[name] = value;
	}
	if (grep) {
		env.MOCHA_GREP = grep;
	}
	return env;
}

/**
 * Build the test command, run from the workspace root that owns the tests: `npx extest setup-and-run`
 * with the arguments from the settings, or the custom `runCommand` when it is set.
 */
export function createTestExecution(
	owner: vscode.WorkspaceFolder,
	configuration: ConfigurationReader,
	finalPath: string,
	logger: Logger,
	grep?: string,
): vscode.ShellExecution {
	const env = getRunEnvironment(configuration, grep);
	const envNames = Object.keys(env);
	if (envNames.length) {
		// Log names only: values can hold secrets. The grep pattern is not secret and helps when no test runs.
		const grepText = grep ? ' (MOCHA_GREP=' + grep + ')' : '';
		logger.info(`Environment variables: ${envNames.join(', ')}${grepText}`);
	}

	const runCommand = configuration.get<string>('runCommand')?.trim();
	if (runCommand) {
		// The custom command owns all of its arguments: the VS Code version, type, storage and additionalArgs are not added.
		const commandLine = buildRunCommand(runCommand, finalPath);
		logger.info(`Running custom command: ${commandLine}`);
		return new vscode.ShellExecution(commandLine, { cwd: owner.uri.fsPath, env });
	}

	const storageArgs = optionArgs(configuration, 'tempFolder', '--storage', true);
	const versionArgs = optionArgs(configuration, 'visualStudioCode.Version', '--code_version');
	const typeArgs = optionArgs(configuration, 'visualStudioCode.Type', '--type');
	const additionalArgs = configuration.get<string[]>('additionalArgs', []) ?? [];
	const processedArgs = additionalArgs.flatMap((arg) => arg.match(/(?:[^\s"]+|"[^"]*")+/g) ?? []);
	const configArgs = getConfigArguments(owner, processedArgs);

	const shellExecution = new vscode.ShellExecution(
		'npx',
		['extest', 'setup-and-run', `'${finalPath}'`, ...storageArgs, ...versionArgs, ...typeArgs, ...processedArgs, ...configArgs],
		{ cwd: owner.uri.fsPath, env },
	);

	const commandArgs = [
		...storageArgs,
		...versionArgs,
		...typeArgs,
		...additionalArgs,
		...configArgs.map((arg) => (typeof arg === 'string' ? arg : `'${arg.value}'`)),
	];
	logger.info(`Running command: npx extest setup-and-run '${finalPath}' ${commandArgs.join(' ')}`);

	return shellExecution;
}
