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

import { TestRunner } from './TestRunnerTask';
import * as path from 'path';
import { Logger } from '../logger/logger';
import { getTaskConfiguration, createTestExecution } from './taskConfiguration';

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
		const resource = vscode.Uri.file(file);
		const { owner, configuration, workspaceFolder } = getTaskConfiguration(resource, logger);

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

		const shellExecution = createTestExecution(configuration, workspaceFolder, finalPath, logger);

		super(owner, 'Run Test File', shellExecution, logger);
	}
}
