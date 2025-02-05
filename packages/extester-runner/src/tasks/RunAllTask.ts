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
import { Logger } from '../logger/logger';
import * as path from 'path';

/**
 * Task for running all tests within the workspace.
 *
 * This task executes all test files found within the specified output folder.
 * It retrieves configuration settings from the VS Code workspace and constructs
 * the appropriate command for running the tests using `extest`.
 */
export class RunAllTestsTask extends TestRunner {
	/**
	 * Creates an instance of the `RunAllTestsTask`.
	 *
	 * This constructor retrieves necessary configurations, constructs the output path,
	 * and sets up the command execution using `ShellExecution`. It processes the provided
	 * file paths to generate the appropriate test execution commands.
	 *
	 * @param {string[]} allFilesAbsolutePaths - Array of absolute paths to all test files
	 * @param {Logger} logger - The logger instance for logging messages
	 */
	constructor(allFilesAbsolutePaths: string[], logger: Logger) {
		const configuration = workspace.getConfiguration('extesterRunner');
		const workspaceFolder = workspace.workspaceFolders?.[0]?.uri.fsPath;

		if (!workspaceFolder) {
			logger.error('No workspace folder found.');
			vscode.window.showErrorMessage(`No workspace folder found.`);
			throw new Error('No workspace folder found.');
		}

		// Get configuration values.
		const outputFolder = configuration.get<string>('outputFolder') || 'out';
		const rootFolder = configuration.get<string>('rootFolder');
		const tempDirSettings = configuration.get<string>('tempFolder');
		logger.debug(`RunAllTask: outputFolder: ${outputFolder}, rootFolder: ${rootFolder}`);
		logger.debug(`RunAllTask: rootFolder: ${rootFolder}`);
		logger.debug(`RunAllTask: tempDirSettings: ${tempDirSettings}`);

		// Find common path and convert to relative path.
		const commonPath = getCommonPath(allFilesAbsolutePaths);
		const relativePath = path.relative(workspaceFolder, commonPath);
		const segments = relativePath.split(/[\/\\]/).filter(Boolean);
		logger.debug('RunAllTask: Common relative path segments: ' + JSON.stringify(segments));

		// Get test file pattern from configuration.
		const testFileGlob = configuration.get<string>('testFileGlob') || '**/ui-test/**/*.test.ts';
		logger.debug(`RunAllTask: Using glob pattern: ${testFileGlob}`);
		const testFileGlobSegments = testFileGlob.split(/[\/\\]/).filter(Boolean);
		const testFilePattern = testFileGlobSegments[testFileGlobSegments.length - 1].replace(/\.ts$/, '.js');
		logger.debug(`RunAllTask: Test file pattern: ${testFilePattern}`);

		// Split paths into segments.
		const outputSegments = outputFolder.split(/[\/\\]/).filter(Boolean);
		const rootSegments = rootFolder ? rootFolder.split(/[\/\\]/).filter(Boolean) : [];
		const relativeSegments = relativePath.split(/[\/\\]/).filter(Boolean);
		logger.debug(
			`RunAllTask: Path segments - Output: ${JSON.stringify(outputSegments)}, Root: ${JSON.stringify(rootSegments)}, Relative: ${JSON.stringify(relativeSegments)}`,
		);

		// Find matching segments between root and relative paths.
		const matchingSegmentsCount =
			rootSegments.length > 0 ? rootSegments.reduce((count, segment, i) => (relativeSegments[i] === segment ? count + 1 : count), 0) : 0;

		// Build final path for test execution.
		const finalPath = path.join(workspaceFolder, outputFolder, ...relativeSegments.slice(matchingSegmentsCount), '**', testFilePattern);
		logger.debug(`RunAllTask: Final path: ${finalPath}`);

		// Prepare command arguments.
		const storageArgs = tempDirSettings && tempDirSettings.trim().length > 0 ? ['--storage', `'${tempDirSettings}'`] : [];
		const visualStudioCodeVersion = configuration.get<string>('visualStudioCode.Version');
		const versionArgs = visualStudioCodeVersion ? ['--code_version', visualStudioCodeVersion] : [];
		const visualStudioCodeType = configuration.get<string>('visualStudioCode.Type');
		const typeArgs = visualStudioCodeType ? ['--type', visualStudioCodeType] : [];
		const additionalArgs = configuration.get<string[]>('additionalArgs', []) || [];
		const processedArgs = additionalArgs.flatMap((arg) => arg.match(/(?:[^\s"]+|"[^"]*")+/g) || []);

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
		logger.info(`RunAllTask: Running command: ${commandString}`);

		super(TaskScope.Workspace, 'Run All Tests', shellExecution, logger);
	}
}

/**
 * Returns the longest common directory path shared among all provided file paths.
 *
 * This function splits each file path by '/' and compares segments in order
 * to determine the shared prefix path. It stops at the first mismatch.
 *
 * @param paths - An array of file paths to analyze.
 * @returns The common leading path shared among all input paths.
 * @returns If no common path exists or the input is empty, returns an empty string.
 */
function getCommonPath(paths: string[]): string {
	if (paths.length === 0) {
		return '';
	}

	const splitPaths = paths.map((p) => p.split('/'));
	const firstPath = splitPaths[0];
	let commonParts: string[] = [];

	for (let i = 0; i < firstPath.length; i++) {
		if (splitPaths.every((parts) => parts[i] === firstPath[i])) {
			commonParts.push(firstPath[i]);
		} else {
			break;
		}
	}
	return commonParts.join('/');
}
