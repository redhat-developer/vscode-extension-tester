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
 * Task for running all test files within a specified folder.
 *
 * This task executes all test files located within a given folder by converting the
 * folder path to match the compiled output structure. It retrieves necessary configurations
 * and constructs the appropriate command for execution using `extest`.
 */
export class RunFolderTask extends TestRunner {
	/**
	 * Creates an instance of the `RunFolderTask`.
	 *
	 * This constructor retrieves configurations, transforms the folder path to match the
	 * compiled output structure, and sets up the shell execution command.
	 *
	 * @param {string} folder - The absolute path of the folder containing test files.
	 * @param {Logger} logger - The logger instance for logging messages.
	 */
	constructor(folder: string, logger: Logger) {
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
		logger.info(`RunFolderTask: outputFolder: ${outputFolder}, rootFolder: ${rootFolder}`);
		logger.info(`RunFolderTask: rootFolder: ${rootFolder}`);
		logger.info(`RunFolderTask: tempDirSettings: ${tempDirSettings}`);

		// Convert folder path to relative path.
		const folderPath = path.resolve(folder);
		const relativePath = path.relative(workspaceFolder, folderPath);

		// Get test file pattern from configuration.
		const testFileGlob = configuration.get<string>('testFileGlob') ?? '**/ui-test/**/*.test.ts';
		logger.debug(`RunFolderTask: Using glob pattern: ${testFileGlob}`);

		// Split paths into segments.
		const outputSegments = outputFolder.split(/[/\\]/).filter(Boolean);
		const rootSegments = rootFolder ? rootFolder.split(/[/\\]/).filter(Boolean) : [];
		const relativeSegments = relativePath.split(/[/\\]/).filter(Boolean);
		logger.debug(
			`RunFolderTask: Path segments - Output: ${JSON.stringify(outputSegments)}, Root: ${JSON.stringify(rootSegments)}, Relative: ${JSON.stringify(relativeSegments)}`,
		);

		// Find matching segments between root and relative paths.
		const matchingSegmentsCount =
			rootSegments.length > 0 ? rootSegments.reduce((count, segment, i) => (relativeSegments[i] === segment ? count + 1 : count), 0) : 0;

		// Build final path for test execution.
		const testFileGlobSegments = testFileGlob.split(/[/\\]/).filter(Boolean);
		const testFilePattern = testFileGlobSegments[testFileGlobSegments.length - 1].replace(/\.ts$/, '.js');

		const finalPath = path.join(workspaceFolder, outputFolder, ...relativeSegments.slice(matchingSegmentsCount), testFilePattern);
		logger.debug(`RunFolderTask: Final path: ${finalPath}`);

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
		logger.info(`RunFolderTask: Running command: ${commandString}`);

		super(TaskScope.Workspace, 'Run Test Folder', shellExecution, logger);
	}
}
