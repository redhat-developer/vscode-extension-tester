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
import { Logger } from '../logger/logger';
import { LogsTreeProvider, LogsResourcesItem } from '../providers/logsTreeProvider';
import { clearResourceDirectory, deleteResourceItem, revealResourceDirectory, revealResourceItem } from './resourceCommands';

/**
 * Registers Logs view related commands for the VS Code extension.
 *
 * @param {vscode.ExtensionContext} context - The extension context, used for registering commands.
 * @param {LogsTreeProvider} logsDataProvider - The tree data provider responsible for managing the logs view.
 * @param {Logger} logger - The logging utility for debugging and tracking command execution.
 */
export function registerLogsCommands(context: vscode.ExtensionContext, logsDataProvider: LogsTreeProvider, logger: Logger) {
	context.subscriptions.push(
		vscode.commands.registerCommand('extester-runner.refreshLogs', () => {
			logger.debug('Command triggered: extester-runner.refreshLogs');
			logsDataProvider.refresh();
		}),
		vscode.commands.registerCommand('extester-runner.clearLogs', () => {
			logger.debug('Command triggered: extester-runner.clearLogs');
			return clearResourceDirectory(logsDataProvider, 'logs', logger);
		}),
		vscode.commands.registerCommand('extester-runner.deleteLogsItem', (item: LogsResourcesItem) => {
			logger.debug(`Command triggered: extester-runner.deleteLogsItem on ${item?.filePath}`);
			return deleteResourceItem(item, logsDataProvider, logger);
		}),
		vscode.commands.registerCommand('extester-runner.revealLogs', () => {
			logger.debug('Command triggered: extester-runner.revealLogs');
			return revealResourceDirectory(logsDataProvider, logger);
		}),
		vscode.commands.registerCommand('extester-runner.revealLogsItem', (item: LogsResourcesItem) => {
			logger.debug(`Command triggered: extester-runner.revealLogsItem on ${item?.filePath}`);
			return revealResourceItem(item, logger);
		}),
	);
}
