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
import * as fs from 'node:fs';
import * as path from 'node:path';
import { Logger } from '../logger/logger';
import { LogsTreeProvider, LogsResourcesItem } from '../providers/logsTreeProvider';

/**
 * Registers Logs view related commands for the VS Code extension.
 *
 * This function registers commands for refreshing and clearing the logs tree view.
 *
 * @param {vscode.ExtensionContext} context - The extension context, used for registering commands.
 * @param {LogsTreeProvider} logsDataProvider - The tree data provider responsible for managing the logs view.
 * @param {Logger} logger - The logging utility for debugging and tracking command execution.
 */
export function registerLogsCommands(context: vscode.ExtensionContext, logsDataProvider: LogsTreeProvider, logger: Logger) {
	context.subscriptions.push(
		/**
		 * Registers the `extester-runner.refreshLogs` command.
		 * This command refreshes the test logs view by triggering an update on the tree data provider.
		 */
		vscode.commands.registerCommand('extester-runner.refreshLogs', async () => {
			logger.debug('Command triggered: extester-runner.refreshLogs');
			logsDataProvider.refresh();
		}),
		/**
		 * Registers the `extester-runner.clearLogs` command.
		 * Asks for confirmation then removes all files and folders inside the resolved logs directory.
		 */
		vscode.commands.registerCommand('extester-runner.clearLogs', async () => {
			logger.debug('Command triggered: extester-runner.clearLogs');
			const answer = await vscode.window.showWarningMessage('Clear all logs? This cannot be undone.', { modal: true }, 'Clear');
			if (answer !== 'Clear') {
				return;
			}
			const logsPath = logsDataProvider.resolveLogPath();
			try {
				await fs.promises.rm(logsPath, { recursive: true, force: true });
				logger.info(`Cleared logs directory: ${logsPath}`);
			} catch (error) {
				logger.error(`Failed to clear logs: ${error}`);
				vscode.window.showErrorMessage(`Failed to clear logs: ${error}`);
			}
			logsDataProvider.refresh();
		}),
		/**
		 * Registers the `extester-runner.deleteLogsItem` command.
		 * Asks for confirmation then removes the selected file or folder from the logs directory.
		 */
		vscode.commands.registerCommand('extester-runner.deleteLogsItem', async (item: LogsResourcesItem) => {
			logger.debug(`Command triggered: extester-runner.deleteLogsItem on ${item?.filePath}`);
			if (!item?.filePath) {
				return;
			}
			const name = path.basename(item.filePath);
			const answer = await vscode.window.showWarningMessage(`Delete '${name}'? This cannot be undone.`, { modal: true }, 'Delete');
			if (answer !== 'Delete') {
				return;
			}
			try {
				await fs.promises.rm(item.filePath, { recursive: true, force: true });
				logger.info(`Deleted logs item: ${item.filePath}`);
			} catch (error) {
				logger.error(`Failed to delete logs item: ${error}`);
				vscode.window.showErrorMessage(`Failed to delete '${name}': ${error}`);
			}
			logsDataProvider.refresh();
		}),
		/**
		 * Registers the `extester-runner.revealLogs` command.
		 * Opens the resolved logs root directory in the OS file manager.
		 */
		vscode.commands.registerCommand('extester-runner.revealLogs', async () => {
			logger.debug('Command triggered: extester-runner.revealLogs');
			const logsPath = logsDataProvider.resolveLogPath();
			if (!fs.existsSync(logsPath)) {
				vscode.window.showInformationMessage('No logs directory found yet.');
				return;
			}
			await vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(logsPath));
		}),

		/**
		 * Registers the `extester-runner.revealLogsItem` command.
		 * Opens the selected log file or folder in the OS file manager.
		 */
		vscode.commands.registerCommand('extester-runner.revealLogsItem', async (item: LogsResourcesItem) => {
			logger.debug(`Command triggered: extester-runner.revealLogsItem on ${item?.filePath}`);
			if (!item?.filePath) {
				return;
			}
			await vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(item.filePath));
		}),
	);
}
