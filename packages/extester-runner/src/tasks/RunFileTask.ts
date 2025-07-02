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
import { ShellExecution, TaskScope, workspace } from 'vscode';
import { TestRunner } from './TestRunnerTask';
import * as path from 'path';
import { Logger } from '../logger/logger';

/**
 * Task for running a single test file within the workspace.
 *
 * This task executes a specified test file by converting its TypeScript path to the
 * corresponding JavaScript file in the output folder. It retrieves necessary configurations
 * and constructs the appropriate command for execution using `extest`.
 */
export class RunFileTask extends TestRunner {
	/**
	 * Creates an instance of the `RunFileTask`.
	 *
	 * This constructor retrieves configurations, transforms the file path to match the
	 * compiled output location, and sets up the shell execution command.
	 *
	 * @param {string} file - The absolute path of the test file to be executed.
	 * @param {Logger} logger - The logger instance for logging messages.
	 */
	constructor(file: string, logger: Logger) {
		const configuration = workspace.getConfiguration('extesterRunner');
		const workspaceFolder = workspace.workspaceFolders?.[0]?.uri.fsPath;

		if (!workspaceFolder) {
			logger.error('No workspace folder found.');
			vscode.window.showErrorMessage(`No workspace folder found.`);
			throw new Error('No workspace folder found.');
		}

		// Get configuration values.
		const outputFolder = configuration.get<string>('outputFolder') ?? 'out';
		const rootFolder = configuration.get<string>('rootFolder');
		const tempDirSettings = configuration.get<string>('tempFolder');
		logger.info(`RunFileTask: outputFolder: ${outputFolder}, rootFolder: ${rootFolder}`);
		logger.info(`RunFileTask: rootFolder: ${rootFolder}`);
		logger.info(`RunFileTask: tempDirSettings: ${tempDirSettings}`);

		// Convert file path to relative path.
		const filePath = path.resolve(file);
		const relativePath = path.relative(workspaceFolder, filePath);

		// Split paths into segments.
		const outputSegments = outputFolder.split(/[/\\]/).filter(Boolean);
		const rootSegments = rootFolder ? rootFolder.split(/[/\\]/).filter(Boolean) : [];
		const relativeSegments = relativePath.split(/[/\\]/).filter(Boolean);
		logger.debug(
			`RunFileTask: Path segments - Output: ${JSON.stringify(outputSegments)}, Root: ${JSON.stringify(rootSegments)}, Relative: ${JSON.stringify(relativeSegments)}`,
		);

		// Find matching segments between root and relative paths.
		const matchingSegmentsCount =
			rootSegments.length > 0 ? rootSegments.reduce((count, segment, i) => (relativeSegments[i] === segment ? count + 1 : count), 0) : 0;

		// Build final path for test execution.
		const finalPath = path.join(
			workspaceFolder,
			outputFolder,
			...relativeSegments.slice(matchingSegmentsCount).map((segment) => (segment.endsWith('.ts') ? segment.replace(/\.ts$/, '.js') : segment)),
		);
		logger.debug(`RunFileTask: Final path: ${finalPath}`);

		// Prepare command arguments.
		const storageArgs = tempDirSettings && tempDirSettings.trim().length > 0 ? ['--storage', `'${tempDirSettings}'`] : [];
		const visualStudioCodeVersion = configuration.get<string>('visualStudioCode.Version');
		const versionArgs = visualStudioCodeVersion ? ['--code_version', visualStudioCodeVersion] : [];
		const visualStudioCodeType = configuration.get<string>('visualStudioCode.Type');
		const typeArgs = visualStudioCodeType ? ['--type', visualStudioCodeType] : [];
		const additionalArgs = configuration.get<string[]>('additionalArgs', []) ?? [];
		const processedArgs = additionalArgs.flatMap((arg) => arg.match(/(?:[^\s"]+|"[^"]*")+/g) ?? []);

		// Create and execute shell command.
		const shellExecution = new ShellExecution('npx', [
			'extest',
			'setup-and-run',
			`'${finalPath}'`,
			...storageArgs,
			...versionArgs,
			...typeArgs,
			...processedArgs,
		]);

		const commandString = `npx extest setup-and-run '${finalPath}' ${storageArgs.join(' ')} ${versionArgs.join(' ')} ${typeArgs.join(' ')} ${additionalArgs.join(' ')}`;
		logger.info(`RunFileTask: Running command: ${commandString}`);

		super(TaskScope.Workspace, 'Run Test File', shellExecution, logger);
	}
}
