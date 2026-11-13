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

/** Resolve the task's workspace and configuration consistently for all run commands. */
export function getTaskConfiguration(resource: vscode.Uri | undefined, logger: Logger) {
	const owner = resource ? vscode.workspace.getWorkspaceFolder(resource) : vscode.workspace.workspaceFolders?.[0];
	const configuration = getRunnerConfiguration(resource);
	const workspaceFolder = owner?.uri.fsPath;

	if (!owner || !workspaceFolder) {
		logger.error('No workspace folder found.');
		vscode.window.showErrorMessage(`No workspace folder found.`);
		throw new Error('No workspace folder found.');
	}

	return { owner, configuration, workspaceFolder };
}

/** Build the shared CLI invocation, preserving argument order and workspace-relative paths. */
export function createTestExecution(configuration: ConfigurationReader, workspaceFolder: string, finalPath: string, logger: Logger): vscode.ShellExecution {
	const tempDirSettings = configuration.get<string>('tempFolder');
	// Prepare command arguments.
	const storageArgs = tempDirSettings && tempDirSettings.trim().length > 0 ? ['--storage', `'${tempDirSettings}'`] : [];
	const visualStudioCodeVersion = configuration.get<string>('visualStudioCode.Version');
	const versionArgs = visualStudioCodeVersion ? ['--code_version', visualStudioCodeVersion] : [];
	const visualStudioCodeType = configuration.get<string>('visualStudioCode.Type');
	const typeArgs = visualStudioCodeType ? ['--type', visualStudioCodeType] : [];
	const additionalArgs = configuration.get<string[]>('additionalArgs', []) ?? [];
	const processedArgs = additionalArgs.flatMap((arg) => arg.match(/(?:[^\s"]+|"[^"]*")+/g) ?? []);

	const configArgs = getConfigArguments(configuration, workspaceFolder, processedArgs);

	// Create and execute shell command.
	const shellExecution = new vscode.ShellExecution(
		'npx',
		['extest', 'setup-and-run', `'${finalPath}'`, ...storageArgs, ...versionArgs, ...typeArgs, ...processedArgs, ...configArgs],
		{ cwd: workspaceFolder },
	);

	const configString = configArgs.map((arg) => (typeof arg === 'string' ? arg : `'${arg.value}'`)).join(' ');
	const commandString = `npx extest setup-and-run '${finalPath}' ${storageArgs.join(' ')} ${versionArgs.join(' ')} ${typeArgs.join(' ')} ${additionalArgs.join(' ')} ${configString}`;
	logger.info(`Running command: ${commandString}`);

	return shellExecution;
}
