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
import { RunTestTask } from '../tasks/RunTestTask';
import { TestRunTarget } from '../types/testTypes';
import { TreeItem } from '../types/treeItem';
import { ExtesterTreeProvider } from '../providers/extesterTreeProvider';
import { TestRunner } from '../tasks/TestRunnerTask';
import { TestRunManager } from '../tasks/runManager';
import { getProjectConfigurationError } from '../utils/projectConfiguration';

/**
 * Create and execute a test task. Creating a task fails, for example, when the ExTester configuration
 * file is invalid; the error is shown to the user instead of VS Code's generic "command failed" message.
 *
 * @param {string} target - What is run, used in the error message.
 * @param {() => TestRunner} createTask - Creates the task to execute.
 * @param {TestRunManager} runManager - Runs the task and shows its state.
 * @param {Logger} logger - Logger instance for reporting errors.
 */
async function runTask(target: string, createTask: () => TestRunner, runManager: TestRunManager, logger: Logger): Promise<void> {
	let task: TestRunner;
	try {
		task = createTask();
	} catch (error) {
		const message = `Cannot run ${target}: ${error instanceof Error ? error.message : String(error)}`;
		logger.error(message);
		void vscode.window.showErrorMessage(message);
		return;
	}
	await runManager.run(task);
}

/**
 * Run all tests of one workspace folder, or log why the folder is skipped.
 * A configuration error in one folder does not prevent the other folders from running.
 *
 * @param {vscode.WorkspaceFolder} folder - The workspace folder to run.
 * @param {string[]} allFiles - Absolute paths of all discovered test files.
 * @param {TestRunManager} runManager - Runs the task and shows its state.
 * @param {Logger} logger - Logger instance.
 */
async function runAllInFolder(folder: vscode.WorkspaceFolder, allFiles: string[], runManager: TestRunManager, logger: Logger): Promise<void> {
	const files = allFiles.filter((file) => vscode.workspace.getWorkspaceFolder(vscode.Uri.file(file))?.uri.toString() === folder.uri.toString());
	if (files.length) {
		await runTask(`tests in ${folder.name}`, () => new RunAllTestsTask(files, logger), runManager, logger);
		return;
	}
	// Test discovery finds no files in a root whose configuration file is invalid; say why it is skipped.
	const error = getProjectConfigurationError(folder.uri);
	const reason = error ? 'its configuration is invalid: ' + error.message : 'no test files found';
	logger.info(`Run All: skipping ${folder.name}, ${reason}.`);
}

/**
 * Registers test-related commands for the VS Code extension.
 *
 * This function registers commands for running all tests, running tests within a folder,
 * running a single test file, running the file open in the editor, stopping the current run
 * and running the last run again. Each run command creates and executes a corresponding test task.
 *
 * @param {vscode.ExtensionContext} context - The extension context, used for registering and managing command lifecycle.
 * @param {ExtesterTreeProvider} treeDataProvider - Provider for managing and updating the test tree view.
 * @param {TestRunManager} runManager - Runs one test task at a time and shows its state.
 * @param {Logger} logger - Logger instance for debugging, diagnostics, and tracking command activity.
 */
export function registerTestCommands(context: vscode.ExtensionContext, treeDataProvider: ExtesterTreeProvider, runManager: TestRunManager, logger: Logger) {
	context.subscriptions.push(
		/**
		 * Registers the `extester-runner.runAll` command.
		 * This command runs the tests of each workspace folder, one folder after another.
		 */
		vscode.commands.registerCommand('extester-runner.runAll', async () => {
			logger.debug('Command triggered: extester-runner.runAll');
			await runManager.startGroup(async () => {
				const allFiles = await treeDataProvider.getAllAbsolutePaths();
				// Test tasks share runner resources, so chain the roots: each starts after the previous one ended.
				await (vscode.workspace.workspaceFolders ?? []).reduce(
					(previous, folder) =>
						previous.then(async () => {
							if (runManager.wasStopped) {
								logger.info(`Run All: stopped, skipping ${folder.name}.`);
								return;
							}
							await runAllInFolder(folder, allFiles, runManager, logger);
						}),
					Promise.resolve(),
				);
			});
		}),

		/**
		 * Registers the `extester-runner.runFolder` command.
		 * This command runs all test files within a specified folder.
		 */
		vscode.commands.registerCommand('extester-runner.runFolder', async (item) => {
			logger.debug(`Command triggered: extester-runner.runFolder for folder ${item.folderPath}`);
			const folderPath: string = item.folderPath;
			await runManager.startGroup(() => runTask(folderPath, () => new RunFolderTask(folderPath, logger), runManager, logger));
		}),

		/**
		 * Registers the `extester-runner.runTest` command.
		 * This command runs one `describe` block or `it` test, from the test view or from a CodeLens in the editor.
		 */
		vscode.commands.registerCommand('extester-runner.runTest', async (item: TreeItem | TestRunTarget) => {
			const target = item instanceof TreeItem ? item.runTarget : item;
			if (!target) {
				return;
			}
			const name = target.titles.join(' > ');
			logger.debug(`Command triggered: extester-runner.runTest for ${name} in ${target.file}`);
			await runManager.startGroup(() => runTask(name, () => new RunTestTask(target.file, target.titles, target.isTest, logger), runManager, logger));
		}),

		/**
		 * Registers the `extester-runner.runFile` command.
		 * This command runs a specific test file within the workspace.
		 */
		vscode.commands.registerCommand('extester-runner.runFile', async (item) => {
			logger.debug(`Command triggered: extester-runner.runFile for file ${item.filePath}`);
			const filePath: string = item.filePath;
			await runManager.startGroup(() => runTask(filePath, () => new RunFileTask(filePath, logger), runManager, logger));
		}),

		/**
		 * Registers the `extester-runner.runCurrentFile` command.
		 * This command runs the test file given by the editor or explorer menu, or the file open in the active editor.
		 */
		vscode.commands.registerCommand('extester-runner.runCurrentFile', async (uri?: vscode.Uri) => {
			const fileUri = uri instanceof vscode.Uri ? uri : vscode.window.activeTextEditor?.document.uri;
			logger.debug(`Command triggered: extester-runner.runCurrentFile for file ${fileUri?.fsPath}`);
			if (fileUri?.scheme !== 'file') {
				void vscode.window.showWarningMessage('Open an ExTester test file to run it.');
				return;
			}
			if (!treeDataProvider.isTestFile(fileUri.fsPath)) {
				void vscode.window.showWarningMessage(
					`${vscode.workspace.asRelativePath(fileUri)} is not an ExTester test file. It does not match the test file pattern.`,
				);
				return;
			}
			const filePath = fileUri.fsPath;
			await runManager.startGroup(() => runTask(filePath, () => new RunFileTask(filePath, logger), runManager, logger));
		}),

		/**
		 * Registers the `extester-runner.stopRun` command.
		 * This command stops the test run in progress.
		 */
		vscode.commands.registerCommand('extester-runner.stopRun', () => {
			logger.debug('Command triggered: extester-runner.stopRun');
			runManager.stop();
		}),

		/**
		 * Registers the `extester-runner.rerunLastRun` command.
		 * This command starts the last run again, with the current settings.
		 */
		vscode.commands.registerCommand('extester-runner.rerunLastRun', async () => {
			logger.debug('Command triggered: extester-runner.rerunLastRun');
			await runManager.rerunLast();
		}),
	);
}
