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
import { getFileTarget, getTestTargetSettings } from './testTarget';

/**
 * Task for running a single test file within the workspace.
 *
 * This task executes a specified test file by converting its TypeScript path to the
 * corresponding JavaScript file in the output folder, or passes the file as is when
 * `runSources` is enabled. It retrieves necessary configurations and constructs the
 * appropriate command for execution using `extest`.
 */
export class RunFileTask extends TestRunner {
	/**
	 * Creates an instance of the `RunFileTask`.
	 *
	 * This constructor retrieves the configuration of the workspace folder that owns the file,
	 * transforms the file path to match the compiled output location (unless `runSources` is enabled),
	 * and sets up the shell execution command.
	 *
	 * @param {string} file - The absolute path of the test file to be executed.
	 * @param {Logger} logger - The logger instance for logging messages.
	 * @throws {Error} When no workspace folder is open or the configuration is invalid.
	 */
	constructor(file: string, logger: Logger) {
		const { owner, configuration, workspaceFolder } = getTaskConfiguration(vscode.Uri.file(file));

		// Get configuration values.
		const settings = getTestTargetSettings(configuration);
		logger.info(`RunFileTask: runSources: ${settings.runSources}, outputFolder: ${settings.outputFolder}, rootFolder: ${settings.rootFolder}`);

		// Build final path for test execution.
		const finalPath = getFileTarget(file, workspaceFolder, settings);
		logger.debug(`RunFileTask: Final path: ${finalPath}`);

		super(owner, 'Run Test File', createTestExecution(owner, configuration, finalPath, logger), logger, configuration.get<string>('preRunTask'));
	}
}
