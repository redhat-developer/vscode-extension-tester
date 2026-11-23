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

/** Build the shared CLI invocation, run from the workspace root that owns the tests. */
export function createTestExecution(
	owner: vscode.WorkspaceFolder,
	configuration: ConfigurationReader,
	finalPath: string,
	logger: Logger,
): vscode.ShellExecution {
	const storageArgs = optionArgs(configuration, 'tempFolder', '--storage', true);
	const versionArgs = optionArgs(configuration, 'visualStudioCode.Version', '--code_version');
	const typeArgs = optionArgs(configuration, 'visualStudioCode.Type', '--type');
	const additionalArgs = configuration.get<string[]>('additionalArgs', []) ?? [];
	const processedArgs = additionalArgs.flatMap((arg) => arg.match(/(?:[^\s"]+|"[^"]*")+/g) ?? []);
	const configArgs = getConfigArguments(owner, processedArgs);

	const shellExecution = new vscode.ShellExecution(
		'npx',
		['extest', 'setup-and-run', `'${finalPath}'`, ...storageArgs, ...versionArgs, ...typeArgs, ...processedArgs, ...configArgs],
		{ cwd: owner.uri.fsPath },
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
