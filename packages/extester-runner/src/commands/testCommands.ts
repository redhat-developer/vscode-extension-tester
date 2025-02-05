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
import { RunAllTestsTask } from '../tasks/RunAllTask';
import { RunFileTask } from '../tasks/RunFileTask';
import { Logger } from '../logger/logger';
import { RunFolderTask } from '../tasks/RunFolderTask';

/**
 * Registers test-related commands for the VS Code extension.
 *
 * This function registers commands for running all tests, running tests within a folder,
 * and running a single test file. Each command creates and executes a corresponding test task.
 *
 * @param {vscode.ExtensionContext} context - The extension context, used for registering commands.
 * @param {Logger} logger - The logging utility for debugging and tracking command execution.
 */
export function registerTestCommands(context: vscode.ExtensionContext, logger: Logger) {
	/**
	 * Registers the `extester-runner.runAll` command.
	 * This command triggers the execution of all available tests in the workspace.
	 */
	context.subscriptions.push(
		vscode.commands.registerCommand('extester-runner.runAll', async () => {
			logger.debug('User triggered: extester-runner.runAll.');
			const task = new RunAllTestsTask(logger);
			await task.execute();
		}),
	);

	/**
	 * Registers the `extester-runner.runFolder` command.
	 * This command runs all test files within a specified folder.
	 */
	context.subscriptions.push(
		vscode.commands.registerCommand('extester-runner.runFolder', async (item) => {
			logger.debug(`User triggered: extester-runner.runFolder for folder ${item.folderPath}.`);
			const task = new RunFolderTask(item.folderPath, logger);
			await task.execute();
		}),
	);

	/**
	 * Registers the `extester-runner.runFile` command.
	 * This command runs a specific test file within the workspace.
	 */
	context.subscriptions.push(
		vscode.commands.registerCommand('extester-runner.runFile', async (item) => {
			logger.debug(`User triggered: extester-runner.runFile for file ${item.filePath}.`);
			const task = new RunFileTask(item.filePath, logger);
			await task.execute();
		}),
	);
}
