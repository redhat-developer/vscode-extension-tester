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
import { Logger } from '../logger/logger';
import { createTestExecution, getTaskConfiguration } from './taskConfiguration';
import { getAllTarget, getTestTargetSettings } from './testTarget';

/**
 * Task for running all tests of one workspace folder.
 *
 * This task executes all test files found within the specified output folder, or the
 * test sources themselves when `runSources` is enabled. It retrieves the configuration of the
 * workspace folder that owns the files and constructs the appropriate command for running the tests using `extest`.
 */
export class RunAllTestsTask extends TestRunner {
	/**
	 * Creates an instance of the `RunAllTestsTask`.
	 *
	 * @param {string[]} allFilesAbsolutePaths - Absolute paths of the test files, all in one workspace folder.
	 * @param {Logger} logger - The logger instance for logging messages
	 * @throws {Error} When no workspace folder is open, the files belong to several workspace folders or the configuration is invalid.
	 */
	constructor(allFilesAbsolutePaths: string[], logger: Logger) {
		const resource = allFilesAbsolutePaths.length ? vscode.Uri.file(allFilesAbsolutePaths[0]) : undefined;
		const { owner, configuration, workspaceFolder } = getTaskConfiguration(resource);

		if (allFilesAbsolutePaths.some((file) => vscode.workspace.getWorkspaceFolder(vscode.Uri.file(file))?.uri.toString() !== owner.uri.toString())) {
			throw new Error('Run All Tests requires files from one workspace folder.');
		}

		// Get configuration values.
		const settings = getTestTargetSettings(configuration);
		logger.debug(`RunAllTask: runSources: ${settings.runSources}, outputFolder: ${settings.outputFolder}, rootFolder: ${settings.rootFolder}`);
		logger.debug(`RunAllTask: Using glob pattern: ${settings.testFileGlob}`);

		// Build final path for test execution.
		const finalPath = getAllTarget(allFilesAbsolutePaths, workspaceFolder, settings);
		logger.debug(`RunAllTask: Final path: ${finalPath}`);

		// Name the root in a multi-root workspace: the label shows which root runs, and
		// TestRunner.waitForEnd() matches the finished task by this label.
		const label = (vscode.workspace.workspaceFolders?.length ?? 0) > 1 ? `Run All Tests (${owner.name})` : 'Run All Tests';
		super(owner, label, createTestExecution(owner, configuration, finalPath, logger), logger);
	}
}
