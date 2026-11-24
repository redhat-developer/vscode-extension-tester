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
import { getFolderTarget, getTestTargetSettings } from './testTarget';

/**
 * Task for running all test files within a specified folder.
 *
 * This task executes all test files located within a given folder by converting the
 * folder path to match the compiled output structure, or by globbing the source folder
 * when `runSources` is enabled. It retrieves necessary configurations and constructs the
 * appropriate command for execution using `extest`.
 */
export class RunFolderTask extends TestRunner {
	/**
	 * Creates an instance of the `RunFolderTask`.
	 *
	 * This constructor retrieves the configuration of the workspace folder that owns the folder,
	 * transforms the folder path to match the compiled output structure (unless `runSources` is enabled),
	 * and sets up the shell execution command.
	 *
	 * @param {string} folder - The absolute path of the folder containing test files.
	 * @param {Logger} logger - The logger instance for logging messages.
	 * @throws {Error} When no workspace folder is open or the configuration is invalid.
	 */
	constructor(folder: string, logger: Logger) {
		const { owner, configuration, workspaceFolder } = getTaskConfiguration(vscode.Uri.file(folder));

		// Get configuration values.
		const settings = getTestTargetSettings(configuration);
		logger.info(`RunFolderTask: runSources: ${settings.runSources}, outputFolder: ${settings.outputFolder}, rootFolder: ${settings.rootFolder}`);
		logger.debug(`RunFolderTask: Using glob pattern: ${settings.testFileGlob}`);

		// Build final path for test execution.
		const finalPath = getFolderTarget(folder, workspaceFolder, settings);
		logger.debug(`RunFolderTask: Final path: ${finalPath}`);

		super(owner, 'Run Test Folder', createTestExecution(owner, configuration, finalPath, logger), logger);
	}
}
